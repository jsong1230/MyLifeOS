import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday, formatDateToString } from '@/lib/date-utils'
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
  return formatDateToString(base)
}

// GET /api/health/sleep — 주간 수면 목록 + 집계 조회
// 쿼리 파라미터:
//   week=YYYY-MM-DD  (주 시작일, 기본값: 이번 주 월요일)
//   date=YYYY-MM-DD  (특정 날짜 단일 조회)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const rawWeek = searchParams.get('week')
  const rawDate = searchParams.get('date')

  // 단일 날짜 조회 모드
  if (rawDate) {
    if (!DATE_PATTERN.test(rawDate)) {
      return apiError('VALIDATION_ERROR')
    }

    const { data, error } = await supabase
      .from('health_logs')
      .select(
        'id, user_id, value, value2, date, time_start, time_end, note, created_at, updated_at'
      )
      .eq('user_id', userId)
      .eq('log_type', 'sleep')
      .eq('date', rawDate)
      .order('created_at', { ascending: true })

    if (error) {
      return apiError('SERVER_ERROR')
    }

    return NextResponse.json({ success: true, data: (data ?? []) as SleepLog[] })
  }

  // 주간 조회 모드
  if (rawWeek && !DATE_PATTERN.test(rawWeek)) {
    return apiError('VALIDATION_ERROR')
  }

  const weekStart = getWeekStart(rawWeek ?? undefined)
  const weekStartDate = new Date(weekStart)
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekEnd = formatDateToString(weekEndDate)

  const { data, error } = await supabase
    .from('health_logs')
    .select(
      'id, user_id, value, value2, date, time_start, time_end, note, created_at, updated_at'
    )
    .eq('user_id', userId)
    .eq('log_type', 'sleep')
    .gte('date', weekStart)
    .lte('date', weekEnd)
    .order('date', { ascending: true })

  if (error) {
    return apiError('SERVER_ERROR')
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: CreateSleepInput
  try {
    body = (await request.json()) as CreateSleepInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // time_start 필수 검증
  if (!body.time_start || !TIME_PATTERN.test(body.time_start)) {
    return apiError('VALIDATION_ERROR')
  }

  // time_end 필수 검증
  if (!body.time_end || !TIME_PATTERN.test(body.time_end)) {
    return apiError('VALIDATION_ERROR')
  }

  // 수면 질 범위 검증 (1-5)
  if (body.value2 !== undefined && body.value2 !== null) {
    if (typeof body.value2 !== 'number' || body.value2 < 1 || body.value2 > 5) {
      return apiError('VALIDATION_ERROR')
    }
  }

  // 날짜 형식 검증
  if (body.date && !DATE_PATTERN.test(body.date)) {
    return apiError('VALIDATION_ERROR')
  }

  // 수면 시간 자동 계산 (자정 초과 처리)
  const sleepHours = calcSleepHours(body.time_start, body.time_end)

  const insertData = {
    user_id: userId,
    log_type: 'sleep',
    value: sleepHours,
    value2: body.value2 ?? null,
    unit: 'hours',
    time_start: body.time_start,
    time_end: body.time_end,
    note: body.note ?? null,
    date: body.date ?? getToday(),
  }

  const { data, error } = await supabase
    .from('health_logs')
    .insert(insertData)
    .select(
      'id, user_id, value, value2, date, time_start, time_end, note, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as SleepLog }, { status: 201 })
}
