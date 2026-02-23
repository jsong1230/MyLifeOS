'use client'

import { useQuery } from '@tanstack/react-query'
import type { EmotionStatsData } from '@/app/api/diaries/emotion-stats/route'

// 감정 통계 조회 훅
export function useEmotionStats(year: number, month: number) {
  return useQuery<EmotionStatsData>({
    queryKey: ['diaries', 'emotion-stats', year, month],
    queryFn: async () => {
      const res = await fetch(
        `/api/diaries/emotion-stats?year=${year}&month=${month}`
      )
      const json = await res.json() as { success: boolean; data: EmotionStatsData; error?: string }
      if (!json.success) throw new Error(json.error ?? '감정 통계 조회 실패')
      return json.data
    },
    enabled: !!year && !!month,
  })
}
