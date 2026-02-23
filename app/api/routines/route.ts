import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateRoutineInput, RoutineWithLog } from '@/types/routine'

/**
 * 오늘이 해당 루틴의 실행일인지 판단
 * - daily: 항상 true
 * - weekly: days_of_week 배열에 오늘 요일 포함 여부
 * - custom: 생성일 기준 interval_days 간격으로 오늘인지 계산
 */
function isRoutineScheduledToday(
  frequency: string,
  daysOfWeek: number[] | null | undefined,
  intervalDays: number | null | undefined,
  createdAt: string,
  targetDate: Date
): boolean {
  if (frequency === 'daily') {
    return true
  }

  if (frequency === 'weekly') {
    // 0=일요일, 1=월요일, ..., 6=토요일
    const dayOfWeek = targetDate.getDay()
    return Array.isArray(daysOfWeek) && daysOfWeek.includes(dayOfWeek)
  }

  if (frequency === 'custom' && intervalDays && intervalDays > 0) {
    // 생성일 기준 interval_days 간격으로 오늘인지 계산
    const created = new Date(createdAt)
    const createdMidnight = new Date(
      created.getFullYear(),
      created.getMonth(),
      created.getDate()
    )
    const targetMidnight = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate()
    )
    const diffMs = targetMidnight.getTime() - createdMidnight.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
    return diffDays >= 0 && diffDays % intervalDays === 0
  }

  return false
}

/**
 * GET /api/routines
 * 오늘의 루틴 목록 조회 (routine_log 포함)
 * 쿼리 파라미터: date (YYYY-MM-DD, 기본값: 오늘)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    // date 파라미터 처리 (기본값: 오늘)
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    let targetDate: Date
    if (dateParam) {
      targetDate = new Date(dateParam)
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: '유효하지 않은 날짜 형식입니다 (YYYY-MM-DD)' },
          { status: 400 }
        )
      }
    } else {
      targetDate = new Date()
    }

    // YYYY-MM-DD 형식으로 변환
    const dateString = targetDate.toISOString().split('T')[0]

    // 루틴 목록 조회 (N+1 방지: routine_logs 조인)
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select(
        'id, user_id, title, description, frequency, days_of_week, interval_days, time_of_day, streak, is_active, created_at, updated_at'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (routinesError) {
      return NextResponse.json(
        { error: '루틴 목록을 조회할 수 없습니다' },
        { status: 500 }
      )
    }

    if (!routines || routines.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 오늘 날짜 routine_logs 일괄 조회 (N+1 방지)
    const routineIds = routines.map((r) => r.id)
    const { data: logs, error: logsError } = await supabase
      .from('routine_logs')
      .select(
        'id, routine_id, user_id, date, completed, completed_at, created_at'
      )
      .eq('user_id', user.id)
      .eq('date', dateString)
      .in('routine_id', routineIds)

    if (logsError) {
      return NextResponse.json(
        { error: '루틴 로그를 조회할 수 없습니다' },
        { status: 500 }
      )
    }

    // 루틴 ID → 로그 매핑
    const logMap = new Map(
      (logs ?? []).map((log) => [log.routine_id, log])
    )

    // 오늘 실행일인 루틴만 필터링 + 로그 포함
    const result: RoutineWithLog[] = routines
      .filter((routine) =>
        isRoutineScheduledToday(
          routine.frequency,
          routine.days_of_week,
          routine.interval_days,
          routine.created_at,
          targetDate
        )
      )
      .map((routine) => ({
        ...routine,
        log: logMap.get(routine.id) ?? null,
      }))

    return NextResponse.json({ success: true, data: result })
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/routines
 * 루틴 생성
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const body = (await request.json()) as CreateRoutineInput

    // 필수 입력값 검증
    if (!body.title || body.title.trim() === '') {
      return NextResponse.json(
        { error: '루틴 제목은 필수입니다' },
        { status: 400 }
      )
    }

    if (!body.frequency || !['daily', 'weekly', 'custom'].includes(body.frequency)) {
      return NextResponse.json(
        { error: '반복 주기는 daily, weekly, custom 중 하나여야 합니다' },
        { status: 400 }
      )
    }

    // weekly 검증
    if (body.frequency === 'weekly') {
      if (
        !body.days_of_week ||
        body.days_of_week.length === 0 ||
        body.days_of_week.some((d) => d < 0 || d > 6)
      ) {
        return NextResponse.json(
          { error: '요일 반복 루틴은 요일을 1개 이상 선택해야 합니다 (0~6)' },
          { status: 400 }
        )
      }
    }

    // custom 검증
    if (body.frequency === 'custom') {
      if (!body.interval_days || body.interval_days < 1) {
        return NextResponse.json(
          { error: '간격 반복 루틴은 1 이상의 interval_days가 필요합니다' },
          { status: 400 }
        )
      }
    }

    // 루틴 생성
    const { data: routine, error: insertError } = await supabase
      .from('routines')
      .insert({
        user_id: user.id,
        title: body.title.trim(),
        description: body.description ?? null,
        frequency: body.frequency,
        days_of_week: body.frequency === 'weekly' ? (body.days_of_week ?? null) : null,
        interval_days: body.frequency === 'custom' ? (body.interval_days ?? null) : null,
        time_of_day: body.time_of_day ?? null,
        streak: 0,
        is_active: true,
      })
      .select(
        'id, user_id, title, description, frequency, days_of_week, interval_days, time_of_day, streak, is_active, created_at, updated_at'
      )
      .maybeSingle()

    if (insertError || !routine) {
      return NextResponse.json(
        { error: '루틴 생성에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: routine }, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
