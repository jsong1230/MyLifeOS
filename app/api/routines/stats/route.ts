import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

export interface RoutineStatItem {
  routine_id: string
  routine_name: string
  completed_days: number
  total_days: number
  rate: number
}

export interface RoutineStatsResponse {
  total_checkins: number
  completed_checkins: number
  rate: number
  per_routine: RoutineStatItem[]
}

/**
 * GET /api/routines/stats
 * 루틴 달성률 통계
 * 쿼리 파라미터:
 *   - week: YYYY-MM-DD (주 시작 월요일) → 해당 주 통계
 *   - month: YYYY-MM → 해당 월 통계
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  const { searchParams } = new URL(request.url)
  const week = searchParams.get('week')
  const month = searchParams.get('month')

  let startDate: string
  let endDate: string
  let totalDays: number

  if (week) {
    // 주간: 월요일 ~ 일요일 (7일)
    const monday = new Date(week + 'T00:00:00')
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    startDate = week
    endDate = sunday.toISOString().split('T')[0]
    totalDays = 7
  } else if (month) {
    // 월간: 1일 ~ 말일
    const [year, monthNum] = month.split('-').map(Number)
    const lastDay = new Date(year, monthNum, 0).getDate()
    startDate = `${month}-01`
    endDate = `${month}-${String(lastDay).padStart(2, '0')}`
    totalDays = lastDay
  } else {
    return apiError('VALIDATION_ERROR')
  }

  // 활성 루틴 목록 조회
  const { data: routines, error: routinesError } = await supabase
    .from('routines')
    .select('id, title, is_active')
    .eq('user_id', user.id)
    .eq('is_active', true)

  if (routinesError) {
    return apiError('SERVER_ERROR')
  }

  if (!routines || routines.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        total_checkins: 0,
        completed_checkins: 0,
        rate: 0,
        per_routine: [],
      } satisfies RoutineStatsResponse,
    })
  }

  // 해당 기간 루틴 로그 조회
  const { data: logs, error: logsError } = await supabase
    .from('routine_logs')
    .select('routine_id, completed, date')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)

  if (logsError) {
    return apiError('SERVER_ERROR')
  }

  // 루틴별 달성률 계산
  const perRoutine: RoutineStatItem[] = routines.map((routine) => {
    const routineLogs = (logs ?? []).filter((l) => l.routine_id === routine.id)
    const completedDays = routineLogs.filter((l) => l.completed).length
    const rate = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0
    return {
      routine_id: routine.id,
      routine_name: routine.title,
      completed_days: completedDays,
      total_days: totalDays,
      rate,
    }
  })

  const totalCheckins = routines.length * totalDays
  const completedCheckins = perRoutine.reduce((sum, r) => sum + r.completed_days, 0)
  const overallRate = totalCheckins > 0 ? Math.round((completedCheckins / totalCheckins) * 100) : 0

  return NextResponse.json({
    success: true,
    data: {
      total_checkins: totalCheckins,
      completed_checkins: completedCheckins,
      rate: overallRate,
      per_routine: perRoutine,
    } satisfies RoutineStatsResponse,
  })
}
