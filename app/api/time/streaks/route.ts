import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday, formatDateToString } from '@/lib/date-utils'

type RoutineLog = {
  routine_id: string
  completed_at: string
}

type Routine = {
  id: string
  name: string
}

/**
 * 날짜 문자열 배열에서 현재 연속일과 최장 연속일을 계산
 */
function computeStreaks(sortedDates: string[], today: string): { current: number; longest: number; lastCompleted: string | null } {
  if (sortedDates.length === 0) {
    return { current: 0, longest: 0, lastCompleted: null }
  }

  // 날짜를 내림차순으로 정렬 (최신→과거)
  const dates = [...new Set(sortedDates)].sort((a, b) => b.localeCompare(a))
  const lastCompleted = dates[0]

  // 현재 스트릭 계산: 오늘 또는 어제부터 연속으로 이어지는 일수
  let current = 0
  const todayDate = new Date(today)

  // 오늘 또는 어제로부터 연속 계산
  const lastDate = new Date(lastCompleted)
  const diffFromToday = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

  if (diffFromToday <= 1) {
    // 오늘 또는 어제 완료한 경우 연속 계산
    current = 1
    let prev = lastDate
    for (let i = 1; i < dates.length; i++) {
      const curr = new Date(dates[i])
      const diff = Math.floor((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24))
      if (diff === 1) {
        current++
        prev = curr
      } else {
        break
      }
    }
  }

  // 최장 스트릭 계산
  let longest = 0
  let runLength = 1
  const ascDates = [...new Set(sortedDates)].sort()

  for (let i = 1; i < ascDates.length; i++) {
    const prev = new Date(ascDates[i - 1])
    const curr = new Date(ascDates[i])
    const diff = Math.floor((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 1) {
      runLength++
    } else {
      longest = Math.max(longest, runLength)
      runLength = 1
    }
  }
  longest = Math.max(longest, runLength)

  return { current, longest, lastCompleted }
}

/**
 * GET /api/time/streaks
 * 루틴별 현재 스트릭 + 최장 스트릭 계산
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('AUTH_REQUIRED')

    const today = getToday()

    // 루틴 목록 조회
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (routinesError) {
      console.error('[GET /api/time/streaks] routines DB error:', routinesError)
      return apiError('SERVER_ERROR')
    }

    if (!routines || routines.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          routines: [],
          total_current_streak: 0,
        },
      })
    }

    // 최근 200일간 routine_logs 조회 (스트릭 계산에 충분한 범위)
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - 200)
    const sinceDateStr = formatDateToString(sinceDate)

    const { data: logs, error: logsError } = await supabase
      .from('routine_logs')
      .select('routine_id, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', sinceDateStr)
      .order('completed_at', { ascending: true })

    if (logsError) {
      console.error('[GET /api/time/streaks] routine_logs DB error:', logsError)
      return apiError('SERVER_ERROR')
    }

    // 루틴별 완료 날짜 그룹핑
    const routineLogMap = new Map<string, string[]>()
    for (const log of (logs ?? []) as RoutineLog[]) {
      const date = log.completed_at.slice(0, 10)
      if (!routineLogMap.has(log.routine_id)) {
        routineLogMap.set(log.routine_id, [])
      }
      routineLogMap.get(log.routine_id)!.push(date)
    }

    // 루틴별 스트릭 계산
    const routineStreaks = (routines as Routine[]).map((routine) => {
      const dates = routineLogMap.get(routine.id) ?? []
      const { current, longest, lastCompleted } = computeStreaks(dates, today)
      return {
        id: routine.id,
        name: routine.name,
        current_streak: current,
        longest_streak: longest,
        last_completed: lastCompleted,
      }
    })

    // 전체 루틴 달성 연속일: 오늘 전체 루틴을 달성한 날짜 기준
    // 각 날짜별 달성 루틴 수 집계
    const dailyAllCompleted: string[] = []
    const totalRoutineCount = routines.length

    const dateTotals = new Map<string, Set<string>>()
    for (const log of (logs ?? []) as RoutineLog[]) {
      const date = log.completed_at.slice(0, 10)
      if (!dateTotals.has(date)) {
        dateTotals.set(date, new Set())
      }
      dateTotals.get(date)!.add(log.routine_id)
    }

    for (const [date, routineSet] of dateTotals) {
      if (routineSet.size >= totalRoutineCount) {
        dailyAllCompleted.push(date)
      }
    }

    const { current: totalCurrentStreak } = computeStreaks(dailyAllCompleted, today)

    return NextResponse.json({
      success: true,
      data: {
        routines: routineStreaks,
        total_current_streak: totalCurrentStreak,
      },
    })
  } catch (err) {
    console.error('[GET /api/time/streaks] Unexpected error:', err)
    return apiError('SERVER_ERROR')
  }
}
