import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
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
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

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
      return apiError('VALIDATION_ERROR')
    }
    startDate = dateParam
    endDate = dateParam
    isSingleDate = true
  } else if (weekParam) {
    // 특정 주 조회 (week=YYYY-MM-DD는 해당 주의 임의 날짜)
    if (!datePattern.test(weekParam)) {
      return apiError('VALIDATION_ERROR')
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
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  const logs = (data ?? []) as DrinkLog[]

  // 주간 집계 계산
  // count: 총 잔 수 합산 (drink_count 기준, WHO 14잔 기준 적용)
  // total_ml: 총 음주량 합계
  const summary = {
    count: logs.reduce((acc, log) => acc + (log.drink_count ?? 1), 0),
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: CreateDrinkInput
  try {
    body = await request.json() as CreateDrinkInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 주종 필수 검증
  const validDrinkTypes = ['beer', 'soju', 'wine', 'whiskey', 'other']
  if (!body.drink_type || !validDrinkTypes.includes(body.drink_type)) {
    return apiError('VALIDATION_ERROR')
  }

  // 음주량 필수 검증
  if (body.amount_ml === undefined || body.amount_ml === null) {
    return apiError('VALIDATION_ERROR')
  }

  if (typeof body.amount_ml !== 'number' || body.amount_ml <= 0) {
    return apiError('VALIDATION_ERROR')
  }

  // 도수 범위 검증 (입력된 경우)
  if (body.alcohol_pct !== undefined && body.alcohol_pct !== null) {
    if (typeof body.alcohol_pct !== 'number' || body.alcohol_pct < 0 || body.alcohol_pct > 100) {
      return apiError('VALIDATION_ERROR')
    }
  }

  // 잔 수 검증 (입력된 경우)
  if (body.drink_count !== undefined && body.drink_count !== null) {
    if (typeof body.drink_count !== 'number' || body.drink_count < 0) {
      return apiError('VALIDATION_ERROR')
    }
  }

  // 날짜 형식 검증
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (body.date && !datePattern.test(body.date)) {
    return apiError('VALIDATION_ERROR')
  }

  const insertData = {
    user_id: userId,
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
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as DrinkLog }, { status: 201 })
}
