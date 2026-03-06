import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

// 히트맵 응답 타입
export interface HeatmapCategory {
  id: string
  name: string
  monthly_totals: { month: string; amount: number; currency: string }[]
}

export interface HeatmapData {
  months: string[]
  categories: HeatmapCategory[]
}

// GET /api/money/stats/heatmap
// 최근 6개월 카테고리별 월별 지출 집계 (통화별 분리)
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  // 최근 6개월 범위 계산
  const now = new Date()
  const months: string[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    )
  }
  const startDate = `${months[0]}-01`

  // transactions + categories 조인 조회
  const { data, error } = await supabase
    .from('transactions')
    .select(
      'amount, currency, date, category_id, category:categories(id, name)'
    )
    .eq('user_id', userId)
    .eq('type', 'expense')
    .gte('date', startDate)
    .order('date', { ascending: true })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  // category × month × currency 집계 맵
  // key: `${categoryId}|${month}|${currency}`
  const aggregateMap = new Map<
    string,
    { categoryId: string; categoryName: string; month: string; currency: string; amount: number }
  >()

  for (const row of data ?? []) {
    const month = (row.date as string).slice(0, 7)
    const currency = (row.currency as string | null) ?? 'KRW'
    const amount = Number(row.amount)

    // categories는 many-to-one 관계라 런타임에서는 단일 객체
    const cat = row.category as unknown as { id: string; name: string } | null
    const categoryId = cat?.id ?? '__none__'
    const categoryName = cat?.name ?? '미분류'

    const key = `${categoryId}|${month}|${currency}`
    const existing = aggregateMap.get(key)
    if (existing) {
      existing.amount += amount
    } else {
      aggregateMap.set(key, { categoryId, categoryName, month, currency, amount })
    }
  }

  // 카테고리별로 grouping
  const categoryMap = new Map<
    string,
    { name: string; monthlyCurrencyMap: Map<string, Map<string, number>> }
  >()

  for (const entry of aggregateMap.values()) {
    if (!categoryMap.has(entry.categoryId)) {
      categoryMap.set(entry.categoryId, {
        name: entry.categoryName,
        monthlyCurrencyMap: new Map(),
      })
    }
    const cat = categoryMap.get(entry.categoryId)!
    if (!cat.monthlyCurrencyMap.has(entry.month)) {
      cat.monthlyCurrencyMap.set(entry.month, new Map())
    }
    cat.monthlyCurrencyMap.get(entry.month)!.set(entry.currency, entry.amount)
  }

  // 응답 형식으로 변환
  // 통화별 분리: 각 (category, month, currency) 조합을 monthly_totals에 포함
  // 동일 카테고리에 여러 통화가 있으면 각각 별도 항목으로
  const categories: HeatmapCategory[] = []

  for (const [catId, catData] of categoryMap.entries()) {
    // 이 카테고리에서 사용된 모든 통화 수집
    const currencies = new Set<string>()
    for (const currencyAmountMap of catData.monthlyCurrencyMap.values()) {
      for (const cur of currencyAmountMap.keys()) {
        currencies.add(cur)
      }
    }

    // 통화별로 카테고리 항목 생성
    for (const currency of currencies) {
      const monthly_totals = months.map((month) => ({
        month,
        amount: catData.monthlyCurrencyMap.get(month)?.get(currency) ?? 0,
        currency,
      }))

      // 모든 달이 0이면 제외
      const hasData = monthly_totals.some((m) => m.amount > 0)
      if (!hasData) continue

      categories.push({
        id: `${catId}|${currency}`,
        name: currencies.size > 1 ? `${catData.name} (${currency})` : catData.name,
        monthly_totals,
      })
    }
  }

  // 전체 지출 합계 내림차순 정렬
  categories.sort((a, b) => {
    const sumA = a.monthly_totals.reduce((s, m) => s + m.amount, 0)
    const sumB = b.monthly_totals.reduce((s, m) => s + m.amount, 0)
    return sumB - sumA
  })

  const responseData: HeatmapData = { months, categories }
  return NextResponse.json({ success: true, data: responseData })
}
