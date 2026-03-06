import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday, formatDateToString } from '@/lib/date-utils'

/**
 * GET /api/time/heatmap
 * 최근 90일 날짜별 할일 완료수 + 루틴 달성률
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('AUTH_REQUIRED')

    const today = getToday()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 89) // 90일 (오늘 포함)
    const startDateStr = formatDateToString(startDate)

    // 90일 날짜 배열 생성
    const dates: string[] = []
    for (let i = 0; i < 90; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      const dateStr = formatDateToString(d)
      if (dateStr <= today) {
        dates.push(dateStr)
      }
    }

    // todos: 날짜별 전체 할일 수와 완료 수
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('due_date, status')
      .eq('user_id', user.id)
      .gte('due_date', startDateStr)
      .lte('due_date', today)

    if (todosError) {
      console.error('[GET /api/time/heatmap] todos DB error:', todosError)
      return apiError('SERVER_ERROR')
    }

    // routine_logs: 날짜별 완료된 루틴 수
    const { data: routineLogs, error: logsError } = await supabase
      .from('routine_logs')
      .select('completed_at, routine_id')
      .eq('user_id', user.id)
      .gte('completed_at', startDateStr)
      .lte('completed_at', today)

    if (logsError) {
      console.error('[GET /api/time/heatmap] routine_logs DB error:', logsError)
      return apiError('SERVER_ERROR')
    }

    // 활성 루틴 수 조회 (분모)
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select('id')
      .eq('user_id', user.id)

    if (routinesError) {
      console.error('[GET /api/time/heatmap] routines DB error:', routinesError)
      return apiError('SERVER_ERROR')
    }

    const totalRoutines = (routines ?? []).length

    // 날짜별 할일 집계
    const todoMap = new Map<string, { completed: number; total: number }>()
    for (const todo of (todos ?? []) as { due_date: string; status: string }[]) {
      if (!todo.due_date) continue
      const date = todo.due_date.slice(0, 10)
      if (!todoMap.has(date)) {
        todoMap.set(date, { completed: 0, total: 0 })
      }
      const entry = todoMap.get(date)!
      entry.total++
      if (todo.status === 'completed') {
        entry.completed++
      }
    }

    // 날짜별 루틴 달성 집계
    const routineMap = new Map<string, Set<string>>()
    for (const log of (routineLogs ?? []) as { completed_at: string; routine_id: string }[]) {
      const date = log.completed_at.slice(0, 10)
      if (!routineMap.has(date)) {
        routineMap.set(date, new Set())
      }
      routineMap.get(date)!.add(log.routine_id)
    }

    // 90일 배열로 변환
    const todoHeatmap = dates.map((date) => {
      const entry = todoMap.get(date) ?? { completed: 0, total: 0 }
      return { date, completed: entry.completed, total: entry.total }
    })

    const routineHeatmap = dates.map((date) => {
      const completedSet = routineMap.get(date) ?? new Set()
      return {
        date,
        completed: completedSet.size,
        total: totalRoutines,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        todo_heatmap: todoHeatmap,
        routine_heatmap: routineHeatmap,
      },
    })
  } catch (err) {
    console.error('[GET /api/time/heatmap] Unexpected error:', err)
    return apiError('SERVER_ERROR')
  }
}
