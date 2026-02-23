import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Asset, CreateAssetInput } from '@/types/asset'

const VALID_ASSET_TYPES = ['cash', 'deposit', 'investment', 'other'] as const

// GET /api/assets?month=YYYY-MM               → 특정 월 자산 목록
// GET /api/assets?trend=6                     → 최근 N개월 월별 합계
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const trendParam = searchParams.get('trend')

  // 월별 합계 트렌드 조회 (최근 N개월)
  if (trendParam) {
    const months = Math.min(Math.max(parseInt(trendParam) || 6, 1), 24)

    const { data, error } = await supabase
      .from('assets')
      .select('month, amount')
      .eq('user_id', user.id)
      .order('month', { ascending: true })

    if (error) {
      return NextResponse.json({ success: false, error: '자산 조회에 실패했습니다' }, { status: 500 })
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
    return NextResponse.json({ success: false, error: 'month 파라미터는 YYYY-MM 형식이어야 합니다' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', user.id)
    .eq('month', month)
    .order('asset_type', { ascending: true })

  if (error) {
    return NextResponse.json({ success: false, error: '자산 조회에 실패했습니다' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: (data ?? []) as Asset[] })
}

// POST /api/assets → 자산 항목 추가
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다' }, { status: 401 })
  }

  let body: CreateAssetInput
  try {
    body = await request.json() as CreateAssetInput
  } catch {
    return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다' }, { status: 400 })
  }

  if (!VALID_ASSET_TYPES.includes(body.asset_type)) {
    return NextResponse.json({ success: false, error: '유효하지 않은 자산 유형입니다' }, { status: 400 })
  }

  if (body.amount == null || isNaN(Number(body.amount)) || Number(body.amount) < 0) {
    return NextResponse.json({ success: false, error: '금액은 0 이상이어야 합니다' }, { status: 400 })
  }

  if (!body.month || !/^\d{4}-\d{2}$/.test(body.month)) {
    return NextResponse.json({ success: false, error: 'month는 YYYY-MM 형식이어야 합니다' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('assets')
    .insert({
      user_id: user.id,
      asset_type: body.asset_type,
      amount: Number(body.amount),
      note: body.note ?? null,
      month: body.month,
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: '자산 추가에 실패했습니다' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data as Asset }, { status: 201 })
}
