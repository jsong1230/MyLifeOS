'use client'

import { useQuery } from '@tanstack/react-query'

export type RoutineStreak = {
  id: string
  name: string
  current_streak: number
  longest_streak: number
  last_completed: string | null
}

export type StreaksData = {
  routines: RoutineStreak[]
  total_current_streak: number
}

export type HeatmapEntry = {
  date: string
  completed: number
  total: number
}

export type HeatmapData = {
  todo_heatmap: HeatmapEntry[]
  routine_heatmap: HeatmapEntry[]
}

/**
 * 루틴 스트릭 데이터 조회 훅
 */
export function useStreaks() {
  return useQuery<StreaksData>({
    queryKey: ['streaks'],
    queryFn: async () => {
      const res = await fetch('/api/time/streaks')
      const json = await res.json() as { success: boolean; data: StreaksData; error?: string }
      if (!json.success) throw new Error(json.error ?? '스트릭 데이터 조회 실패')
      return json.data
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시
  })
}

/**
 * 활동 히트맵 데이터 조회 훅 (최근 90일)
 */
export function useActivityHeatmap() {
  return useQuery<HeatmapData>({
    queryKey: ['heatmap'],
    queryFn: async () => {
      const res = await fetch('/api/time/heatmap')
      const json = await res.json() as { success: boolean; data: HeatmapData; error?: string }
      if (!json.success) throw new Error(json.error ?? '히트맵 데이터 조회 실패')
      return json.data
    },
    staleTime: 1000 * 60 * 5, // 5분 캐시
  })
}
