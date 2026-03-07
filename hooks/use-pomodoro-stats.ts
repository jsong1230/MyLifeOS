'use client'

import { useQuery } from '@tanstack/react-query'
import type { PomodoroStatsData } from '@/app/api/time/pomodoro/stats/route'

export type { PomodoroStatsData }

interface PomodoroStatsResponse {
  success: boolean
  data: PomodoroStatsData
  error?: string
}

/**
 * 포모도로 통계 조회 훅
 * @param days - 조회 기간 (기본 7일, 최대 90일)
 */
export function usePomodoroStats(days: number = 7) {
  return useQuery<PomodoroStatsData, Error>({
    queryKey: ['pomodoro-stats', days],
    queryFn: async () => {
      const res = await fetch(`/api/time/pomodoro/stats?days=${days}`)
      const json = await res.json() as PomodoroStatsResponse
      if (!json.success) throw new Error(json.error ?? '포모도로 통계 조회 실패')
      return json.data
    },
    staleTime: 1000 * 60 * 5, // 5분
  })
}
