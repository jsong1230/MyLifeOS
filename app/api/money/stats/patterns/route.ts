import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

export interface WeekdaySpending {
  weekday: number // 0=월, 1=화, ..., 6=일
  avg_amount: number
  currency: string
}

export interface TopCategory {
  category_name: string
  total: number
  currency: string
  percentage: number
}

export interface MonthlyComparison {
  current_month: number
  prev_month: number
  change_pct: number
  currency: string
}

export interface PatternsData {
  by_weekday: WeekdaySpending[]
  top_categories: TopCategory[]
  monthly_comparison: MonthlyComparison[]
}

// GET /api/money/stats/patterns
// 소비 패턴 분석: 요일별 평균 지출, TOP5 카테고리, 전월 대비
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  // 최근 6개월 범위
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const startStr = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`

  // 이번 달 / 전 달 범위
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

  const prevDate = new Date(currentYear, currentMonth - 2, 1)
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  const currentStart = `${currentMonthStr}-01`
  const prevStart = `${prevMonthStr}-01`
  // 전월 말일
  const prevLastDay = new Date(currentYear, currentMonth - 1, 0).getDate()
  const prevEnd = `${prevMonthStr}-${String(prevLastDay).padStart(2, '0')}`

  // 6개월치 expense 트랜잭션 조회
  const { data, error } = await supabase
    .from('transactions')
    .select('amount, currency, date, category:categories(name)')
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', startStr)
    .order('date', { ascending: true })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  const rows = data ?? []

  // ── 1. 요일별 평균 지출 (통화별 분리) ──
  // weekdayMap: currency → weekday(0-6) → { total, count }
  const weekdayMap = new Map<string, Map<number, { total: number; count: number }>>()

  for (const row of rows) {
    const currency = (row.currency as string | null) ?? 'KRW'
    const amount = Number(row.amount)
    const date = new Date((row.date as string) + 'T00:00:00')
    // JS getDay(): 0=일, 1=월, ..., 6=토 → 월=0 기준으로 변환
    const jsDay = date.getDay()
    const weekday = jsDay === 0 ? 6 : jsDay - 1 // 0=월 ~ 6=일

    if (!weekdayMap.has(currency)) {
      weekdayMap.set(currency, new Map())
    }
    const currencyMap = weekdayMap.get(currency)!
    const existing = currencyMap.get(weekday)
    if (existing) {
      existing.total += amount
      existing.count += 1
    } else {
      currencyMap.set(weekday, { total: amount, count: 1 })
    }
  }

  const by_weekday: WeekdaySpending[] = []
  // 주요 통화 우선 처리 (KRW, USD, CAD 순)
  const sortedCurrencies = [...weekdayMap.keys()].sort()
  for (const currency of sortedCurrencies) {
    const currencyMap = weekdayMap.get(currency)!
    for (let wd = 0; wd < 7; wd++) {
      const entry = currencyMap.get(wd)
      by_weekday.push({
        weekday: wd,
        avg_amount: entry ? Math.round(entry.total / entry.count) : 0,
        currency,
      })
    }
  }

  // ── 2. TOP5 카테고리 (통화별 분리) ──
  // categoryTotalMap: currency → categoryName → total
  const categoryTotalMap = new Map<string, Map<string, number>>()

  for (const row of rows) {
    const currency = (row.currency as string | null) ?? 'KRW'
    const amount = Number(row.amount)
    const cat = row.category as unknown as { name: string } | null
    const catName = cat?.name ?? '미분류'

    if (!categoryTotalMap.has(currency)) {
      categoryTotalMap.set(currency, new Map())
    }
    const curMap = categoryTotalMap.get(currency)!
    curMap.set(catName, (curMap.get(catName) ?? 0) + amount)
  }

  const top_categories: TopCategory[] = []
  for (const currency of [...categoryTotalMap.keys()].sort()) {
    const curMap = categoryTotalMap.get(currency)!
    const grandTotal = [...curMap.values()].reduce((s, v) => s + v, 0)
    const sorted = [...curMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    for (const [catName, total] of sorted) {
      top_categories.push({
        category_name: catName,
        total,
        currency,
        percentage: grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0,
      })
    }
  }

  // ── 3. 전월 대비 (통화별) ──
  // 이번 달과 전월의 지출 합계를 통화별로 집계
  const currentMonthMap = new Map<string, number>()
  const prevMonthMap = new Map<string, number>()

  for (const row of rows) {
    const dateStr = row.date as string
    const currency = (row.currency as string | null) ?? 'KRW'
    const amount = Number(row.amount)

    if (dateStr >= currentStart) {
      currentMonthMap.set(currency, (currentMonthMap.get(currency) ?? 0) + amount)
    } else if (dateStr >= prevStart && dateStr <= prevEnd) {
      prevMonthMap.set(currency, (prevMonthMap.get(currency) ?? 0) + amount)
    }
  }

  // 이번 달 또는 전월에 등장한 모든 통화
  const compCurrencies = new Set([...currentMonthMap.keys(), ...prevMonthMap.keys()])
  const monthly_comparison: MonthlyComparison[] = []

  for (const currency of [...compCurrencies].sort()) {
    const current_month = currentMonthMap.get(currency) ?? 0
    const prev_month = prevMonthMap.get(currency) ?? 0
    const change_pct =
      prev_month > 0 ? Math.round(((current_month - prev_month) / prev_month) * 100) : 0

    monthly_comparison.push({ current_month, prev_month, change_pct, currency })
  }

  const responseData: PatternsData = { by_weekday, top_categories, monthly_comparison }
  return NextResponse.json({ success: true, data: responseData })
}
