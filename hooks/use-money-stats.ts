'use client'

import { useQuery } from '@tanstack/react-query'
import type { HeatmapData } from '@/app/api/money/stats/heatmap/route'
import type { PatternsData } from '@/app/api/money/stats/patterns/route'

// 히트맵 데이터 조회 훅
export function useHeatmapData() {
  return useQuery<HeatmapData>({
    queryKey: ['money', 'heatmap'],
    queryFn: async () => {
      const res = await fetch('/api/money/stats/heatmap')
      const json = (await res.json()) as {
        success: boolean
        data: HeatmapData
        error?: string
      }
      if (!json.success) throw new Error(json.error ?? '히트맵 데이터 조회 실패')
      return json.data
    },
    staleTime: 1000 * 60 * 5, // 5분 캐싱
  })
}

// 소비 패턴 분석 조회 훅
export function useSpendingPatterns() {
  return useQuery<PatternsData>({
    queryKey: ['money', 'patterns'],
    queryFn: async () => {
      const res = await fetch('/api/money/stats/patterns')
      const json = (await res.json()) as {
        success: boolean
        data: PatternsData
        error?: string
      }
      if (!json.success) throw new Error(json.error ?? '소비 패턴 조회 실패')
      return json.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
