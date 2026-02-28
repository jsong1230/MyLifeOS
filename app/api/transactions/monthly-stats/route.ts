import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { fetchExchangeRatesServer } from '@/lib/exchange-rates.server'
import { convertCurrency, type CurrencyCode } from '@/lib/currency'

// GET /api/transactions/monthly-stats?months=6
// 최근 N개월 월별 수입/지출 합계 반환 (F-22 월별 지출 추이)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const months = Math.min(Math.max(parseInt(searchParams.get('months') ?? '6') || 6, 1), 24)
  const currencyParam = (searchParams.get('currency') ?? 'KRW') as CurrencyCode

  // 최근 N개월 시작일 계산
  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)
  const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-01`

  const [txResult, rates] = await Promise.all([
    supabase
      .from('transactions')
      .select('date, type, amount, currency')
      .eq('user_id', userId)
      .gte('date', startStr)
      .order('date', { ascending: true }),
    fetchExchangeRatesServer(),
  ])

  if (txResult.error) {
    return apiError('SERVER_ERROR')
  }

  // 월별 수입/지출 집계 (목표 통화로 환산)
  const monthMap = new Map<string, { income: number; expense: number }>()

  for (const tx of txResult.data ?? []) {
    const month = tx.date.slice(0, 7)  // YYYY-MM
    if (!monthMap.has(month)) {
      monthMap.set(month, { income: 0, expense: 0 })
    }
    const from = (tx.currency ?? 'KRW') as CurrencyCode
    const converted = convertCurrency(Number(tx.amount), from, currencyParam, rates)
    const entry = monthMap.get(month)!
    if (tx.type === 'income') {
      entry.income += converted
    } else {
      entry.expense += converted
    }
  }

  // 빈 달도 포함하여 N개월 배열 생성
  const result: { month: string; income: number; expense: number }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const entry = monthMap.get(m) ?? { income: 0, expense: 0 }
    result.push({ month: m, income: entry.income, expense: entry.expense })
  }

  return NextResponse.json({ success: true, data: result })
}
