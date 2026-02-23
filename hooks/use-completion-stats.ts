'use client'

import { useQuery } from '@tanstack/react-query'
import type { TodoStatsResponse } from '@/app/api/todos/stats/route'
import type { RoutineStatsResponse } from '@/app/api/routines/stats/route'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// 할일 완료율 통계 (주간)
export function useTodoWeeklyStats(weekStart: string) {
  return useQuery<TodoStatsResponse>({
    queryKey: ['todo-stats', 'week', weekStart],
    queryFn: async () => {
      const res = await fetch(`/api/todos/stats?week=${weekStart}`)
      const json = await res.json() as ApiResponse<TodoStatsResponse>
      if (!json.success) throw new Error(json.error ?? '할일 통계 조회 실패')
      return json.data
    },
    enabled: !!weekStart,
  })
}

// 할일 완료율 통계 (월간)
export function useTodoMonthlyStats(month: string) {
  return useQuery<TodoStatsResponse>({
    queryKey: ['todo-stats', 'month', month],
    queryFn: async () => {
      const res = await fetch(`/api/todos/stats?month=${month}`)
      const json = await res.json() as ApiResponse<TodoStatsResponse>
      if (!json.success) throw new Error(json.error ?? '할일 통계 조회 실패')
      return json.data
    },
    enabled: !!month,
  })
}

// 루틴 달성률 통계 (주간)
export function useRoutineWeeklyStats(weekStart: string) {
  return useQuery<RoutineStatsResponse>({
    queryKey: ['routine-stats', 'week', weekStart],
    queryFn: async () => {
      const res = await fetch(`/api/routines/stats?week=${weekStart}`)
      const json = await res.json() as ApiResponse<RoutineStatsResponse>
      if (!json.success) throw new Error(json.error ?? '루틴 통계 조회 실패')
      return json.data
    },
    enabled: !!weekStart,
  })
}

// 루틴 달성률 통계 (월간)
export function useRoutineMonthlyStats(month: string) {
  return useQuery<RoutineStatsResponse>({
    queryKey: ['routine-stats', 'month', month],
    queryFn: async () => {
      const res = await fetch(`/api/routines/stats?month=${month}`)
      const json = await res.json() as ApiResponse<RoutineStatsResponse>
      if (!json.success) throw new Error(json.error ?? '루틴 통계 조회 실패')
      return json.data
    },
    enabled: !!month,
  })
}
