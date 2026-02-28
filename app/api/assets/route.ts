import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { fetchExchangeRatesServer } from '@/lib/exchange-rates.server'
import { convertCurrency, type CurrencyCode } from '@/lib/currency'
import type { Asset, CreateAssetInput } from '@/types/asset'

const VALID_ASSET_TYPES = ['cash', 'deposit', 'investment', 'other'] as const

// GET /api/assets?month=YYYY-MM               → 특정 월 자산 목록
// GET /api/assets?trend=6                     → 최근 N개월 월별 합계
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const trendParam = searchParams.get('trend')
  const currencyParam = (searchParams.get('currency') ?? 'KRW') as CurrencyCode

  // 월별 합계 트렌드 조회 (최근 N개월)
  if (trendParam) {
    const months = Math.min(Math.max(parseInt(trendParam) || 6, 1), 24)

    const [assetsResult, rates] = await Promise.all([
      supabase
        .from('assets')
        .select('month, amount, currency')
        .eq('user_id', userId)
        .order('month', { ascending: true }),
      fetchExchangeRatesServer(),
    ])

    if (assetsResult.error) {
      return apiError('SERVER_ERROR')
    }

    // 월별 합계 집계 (목표 통화로 환산)
    const monthMap = new Map<string, number>()
    for (const row of assetsResult.data ?? []) {
      const from = (row.currency ?? 'KRW') as CurrencyCode
      const converted = convertCurrency(Number(row.amount), from, currencyParam, rates)
      monthMap.set(row.month, (monthMap.get(row.month) ?? 0) + converted)
    }

    // 최근 N개월만 반환 (내림차순 정렬 후 슬라이스)
    const sorted = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-months)
      .map(([m, total]) => ({ month: m, total }))

    return NextResponse.json({ success: true, data: sorted })
  }

  // 특정 월 자산 목록 조회
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return apiError('VALIDATION_ERROR')
  }

  const { data, error } = await supabase
    .from('assets')
    .select('id, user_id, asset_type, amount, note, month, currency, created_at, updated_at')
    .eq('user_id', userId)
    .eq('month', month)
    .order('asset_type', { ascending: true })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: (data ?? []) as Asset[] })
}

// POST /api/assets → 자산 항목 추가
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: CreateAssetInput
  try {
    body = await request.json() as CreateAssetInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (!VALID_ASSET_TYPES.includes(body.asset_type)) {
    return apiError('VALIDATION_ERROR')
  }

  if (body.amount == null || isNaN(Number(body.amount)) || Number(body.amount) < 0) {
    return apiError('VALIDATION_ERROR')
  }

  if (!body.month || !/^\d{4}-\d{2}$/.test(body.month)) {
    return apiError('VALIDATION_ERROR')
  }

  const { data, error } = await supabase
    .from('assets')
    .insert({
      user_id: userId,
      asset_type: body.asset_type,
      amount: Number(body.amount),
      note: body.note ?? null,
      month: body.month,
      currency: body.currency ?? 'KRW',
    })
    .select('id, user_id, asset_type, amount, note, month, currency, created_at, updated_at')
    .single()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as Asset }, { status: 201 })
}
