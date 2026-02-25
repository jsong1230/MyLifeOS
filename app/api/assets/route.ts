import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { Asset, CreateAssetInput } from '@/types/asset'

const VALID_ASSET_TYPES = ['cash', 'deposit', 'investment', 'other'] as const

// GET /api/assets?month=YYYY-MM               → 특정 월 자산 목록
// GET /api/assets?trend=6                     → 최근 N개월 월별 합계
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return apiError('AUTH_REQUIRED')
  }
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const trendParam = searchParams.get('trend')

  // 월별 합계 트렌드 조회 (최근 N개월)
  if (trendParam) {
    const months = Math.min(Math.max(parseInt(trendParam) || 6, 1), 24)

    const { data, error } = await supabase
      .from('assets')
      .select('month, amount')
      .eq('user_id', userId)
      .order('month', { ascending: true })

    if (error) {
      return apiError('SERVER_ERROR')
    }

    // 월별 합계 집계
    const monthMap = new Map<string, number>()
    for (const row of data ?? []) {
      monthMap.set(row.month, (monthMap.get(row.month) ?? 0) + Number(row.amount))
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
    .select('*')
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
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return apiError('AUTH_REQUIRED')
  }
  const supabase = await createClient()

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
    .select('*')
    .single()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as Asset }, { status: 201 })
}
