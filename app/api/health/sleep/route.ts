import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateSleepInput, SleepLog } from '@/types/health'

// HH:MM → 분 변환
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// 수면 시간 계산 (자정 초과 처리)
function calcSleepHours(start: string, end: string): number {
  let startMin = timeToMinutes(start)
  let endMin = timeToMinutes(end)
  if (endMin <= startMin) endMin += 24 * 60 // 자정 넘김
  return Math.round(((endMin - startMin) / 60) * 10) / 10 // 소수점 1자리
}

// HH:MM 형식 검증
const TIME_PATTERN = /^\d{2}:\d{2}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// 이번 주 월요일 계산 (YYYY-MM-DD)
function getWeekStart(refDate?: string): string {
  const base = refDate ? new Date(refDate) : new Date()
  const day = base.getDay() // 0=일, 1=월, ...
  const diff = day === 0 ? -6 : 1 - day // 월요일로 조정
  base.setDate(base.getDate() + diff)
  return base.toISOString().split('T')[0]
}

// GET /api/health/sleep — 주간 수면 목록 + 집계 조회
// 쿼리 파라미터:
//   week=YYYY-MM-DD  (주 시작일, 기본값: 이번 주 월요일)
//   date=YYYY-MM-DD  (특정 날짜 단일 조회)
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
  const rawWeek = searchParams.get('week')
  const rawDate = searchParams.get('date')

  // 단일 날짜 조회 모드
  if (rawDate) {
    if (!DATE_PATTERN.test(rawDate)) {
      return NextResponse.json(
        { success: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('health_logs')
      .select(
        'id, user_id, value, value2, date, time_start, time_end, note, created_at, updated_at'
      )
      .eq('user_id', user.id)
      .eq('log_type', 'sleep')
      .eq('date', rawDate)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: '수면 기록 조회에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: (data ?? []) as SleepLog[] })
  }

  // 주간 조회 모드
  if (rawWeek && !DATE_PATTERN.test(rawWeek)) {
    return NextResponse.json(
      { success: false, error: '주 시작일 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  const weekStart = getWeekStart(rawWeek ?? undefined)
  const weekStartDate = new Date(weekStart)
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekEnd = weekEndDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('health_logs')
    .select(
      'id, user_id, value, value2, date, time_start, time_end, note, created_at, updated_at'
    )
    .eq('user_id', user.id)
    .eq('log_type', 'sleep')
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .order('date', { ascending: true })

  if (error) {
    return NextResponse.json(
      { success: false, error: '수면 기록 조회에 실패했습니다' },
      { status: 500 }
    )
  }

  const logs = (data ?? []) as SleepLog[]

  // 주간 집계: 평균 수면 시간, 평균 수면 질
  const totalLogs = logs.length
  const avgHours =
    totalLogs > 0
      ? Math.round((logs.reduce((sum, l) => sum + l.value, 0) / totalLogs) * 10) / 10
      : 0

  const qualityLogs = logs.filter((l) => l.value2 != null)
  const avgQuality =
    qualityLogs.length > 0
      ? Math.round(
          (qualityLogs.reduce((sum, l) => sum + (l.value2 ?? 0), 0) / qualityLogs.length) * 10
        ) / 10
      : 0

  return NextResponse.json({
    success: true,
    data: logs,
    summary: {
      avg_hours: avgHours,
      avg_quality: avgQuality,
      week_start: weekStart,
      week_end: weekEnd,
    },
  })
}

// POST /api/health/sleep — 수면 기록 생성
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

  let body: CreateSleepInput
  try {
    body = (await request.json()) as CreateSleepInput
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // time_start 필수 검증
  if (!body.time_start || !TIME_PATTERN.test(body.time_start)) {
    return NextResponse.json(
      { success: false, error: '취침 시각은 HH:MM 형식으로 입력해주세요' },
      { status: 400 }
    )
  }

  // time_end 필수 검증
  if (!body.time_end || !TIME_PATTERN.test(body.time_end)) {
    return NextResponse.json(
      { success: false, error: '기상 시각은 HH:MM 형식으로 입력해주세요' },
      { status: 400 }
    )
  }

  // 수면 질 범위 검증 (1-5)
  if (body.value2 !== undefined && body.value2 !== null) {
    if (typeof body.value2 !== 'number' || body.value2 < 1 || body.value2 > 5) {
      return NextResponse.json(
        { success: false, error: '수면 질은 1~5 사이의 값이어야 합니다' },
        { status: 400 }
      )
    }
  }

  // 날짜 형식 검증
  if (body.date && !DATE_PATTERN.test(body.date)) {
    return NextResponse.json(
      { success: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  // 수면 시간 자동 계산 (자정 초과 처리)
  const sleepHours = calcSleepHours(body.time_start, body.time_end)

  const insertData = {
    user_id: user.id,
    log_type: 'sleep',
    value: sleepHours,
    value2: body.value2 ?? null,
    unit: 'hours',
    time_start: body.time_start,
    time_end: body.time_end,
    note: body.note ?? null,
    date: body.date ?? new Date().toISOString().split('T')[0],
  }

  const { data, error } = await supabase
    .from('health_logs')
    .insert(insertData)
    .select(
      'id, user_id, value, value2, date, time_start, time_end, note, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '수면 기록 생성에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as SleepLog }, { status: 201 })
}
