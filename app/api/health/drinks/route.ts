import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateDrinkInput, DrinkLog } from '@/types/health'

// 날짜(YYYY-MM-DD)로부터 해당 주 월요일 날짜 반환
function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getUTCDay() // 0=일, 1=월, ..., 6=토
  // 월요일 기준 주 시작: 일요일이면 -6, 나머지는 -(day-1)
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setUTCDate(date.getUTCDate() + diff)
  return monday.toISOString().split('T')[0]
}

// 주 시작일(월요일)로부터 주 종료일(일요일) 반환
function getWeekEnd(weekStart: string): string {
  const date = new Date(weekStart)
  date.setUTCDate(date.getUTCDate() + 6)
  return date.toISOString().split('T')[0]
}

// GET /api/health/drinks — 음주 기록 목록 조회
// 쿼리 파라미터:
//   week=YYYY-MM-DD  : 해당 주(월~일) 기록 조회
//   date=YYYY-MM-DD  : 특정 날짜 기록 조회
//   (파라미터 없으면 이번 주 조회)
// 응답: { success, data: DrinkLog[], summary: { count, total_ml } }
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(request.url)
  const weekParam = searchParams.get('week')
  const dateParam = searchParams.get('date')

  const datePattern = /^\d{4}-\d{2}-\d{2}$/

  let startDate: string
  let endDate: string
  let isSingleDate = false

  if (dateParam) {
    // 특정 날짜 조회
    if (!datePattern.test(dateParam)) {
      return NextResponse.json(
        { success: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
        { status: 400 }
      )
    }
    startDate = dateParam
    endDate = dateParam
    isSingleDate = true
  } else if (weekParam) {
    // 특정 주 조회 (week=YYYY-MM-DD는 해당 주의 임의 날짜)
    if (!datePattern.test(weekParam)) {
      return NextResponse.json(
        { success: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
        { status: 400 }
      )
    }
    startDate = getWeekStart(weekParam)
    endDate = getWeekEnd(startDate)
  } else {
    // 기본값: 이번 주
    const today = new Date().toISOString().split('T')[0]
    startDate = getWeekStart(today)
    endDate = getWeekEnd(startDate)
  }

  const { data, error } = await supabase
    .from('drink_logs')
    .select(
      'id, user_id, drink_type, alcohol_pct, amount_ml, drink_count, date, note, created_at, updated_at'
    )
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { success: false, error: '음주 기록 조회에 실패했습니다' },
      { status: 500 }
    )
  }

  const logs = (data ?? []) as DrinkLog[]

  // 주간 집계 계산
  // count: 기록 건수, total_ml: 총 음주량 합계
  const summary = {
    count: logs.length,
    total_ml: logs.reduce((acc, log) => acc + Number(log.amount_ml), 0),
  }

  return NextResponse.json({
    success: true,
    data: logs,
    summary,
    ...(isSingleDate ? {} : { week_start: startDate, week_end: endDate }),
  })
}

// POST /api/health/drinks — 음주 기록 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다' },
      { status: 401 }
    )
  }

  let body: CreateDrinkInput
  try {
    body = await request.json() as CreateDrinkInput
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 주종 필수 검증
  const validDrinkTypes = ['beer', 'soju', 'wine', 'whiskey', 'other']
  if (!body.drink_type || !validDrinkTypes.includes(body.drink_type)) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 주종입니다 (beer/soju/wine/whiskey/other)' },
      { status: 400 }
    )
  }

  // 음주량 필수 검증
  if (body.amount_ml === undefined || body.amount_ml === null) {
    return NextResponse.json(
      { success: false, error: '음주량(ml)은 필수입니다' },
      { status: 400 }
    )
  }

  if (typeof body.amount_ml !== 'number' || body.amount_ml <= 0) {
    return NextResponse.json(
      { success: false, error: '음주량은 0보다 커야 합니다' },
      { status: 400 }
    )
  }

  // 도수 범위 검증 (입력된 경우)
  if (body.alcohol_pct !== undefined && body.alcohol_pct !== null) {
    if (typeof body.alcohol_pct !== 'number' || body.alcohol_pct < 0 || body.alcohol_pct > 100) {
      return NextResponse.json(
        { success: false, error: '도수는 0~100 사이여야 합니다' },
        { status: 400 }
      )
    }
  }

  // 잔 수 검증 (입력된 경우)
  if (body.drink_count !== undefined && body.drink_count !== null) {
    if (typeof body.drink_count !== 'number' || body.drink_count < 0) {
      return NextResponse.json(
        { success: false, error: '잔 수는 0 이상이어야 합니다' },
        { status: 400 }
      )
    }
  }

  // 날짜 형식 검증
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (body.date && !datePattern.test(body.date)) {
    return NextResponse.json(
      { success: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  const insertData = {
    user_id: user.id,
    drink_type: body.drink_type,
    alcohol_pct: body.alcohol_pct ?? null,
    amount_ml: body.amount_ml,
    drink_count: body.drink_count ?? null,
    date: body.date ?? new Date().toISOString().split('T')[0],
    note: body.note ?? null,
  }

  const { data, error } = await supabase
    .from('drink_logs')
    .insert(insertData)
    .select(
      'id, user_id, drink_type, alcohol_pct, amount_ml, drink_count, date, note, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '음주 기록 생성에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as DrinkLog }, { status: 201 })
}
