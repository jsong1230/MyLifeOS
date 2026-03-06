'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getToday } from '@/lib/date-utils'
import type { WaterLog, CreateWaterInput } from '@/types/health'

// GET 응답 타입
interface WaterResponse {
  success: boolean
  data: WaterLog[]
  total_ml: number
  error?: string
}

// 날짜별 수분 섭취 목록 + 합계 조회 훅 (쿼리 키: ['water', date])
export function useWater(date?: string) {
  const queryDate = date ?? getToday()

  return useQuery<WaterResponse>({
    queryKey: ['water', queryDate],
    queryFn: async () => {
      const res = await fetch(`/api/health/water?date=${queryDate}`)
      const json = await res.json() as WaterResponse
      if (!json.success) throw new Error(json.error ?? '수분 기록 조회 실패')
      return json
    },
  })
}

// 수분 섭취 기록 추가 훅
export function useAddWater() {
  const queryClient = useQueryClient()

  return useMutation<WaterLog, Error, CreateWaterInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/health/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: WaterLog; error?: string }
      if (!json.success) throw new Error(json.error ?? '수분 기록 추가 실패')
      return json.data
    },
    onSuccess: () => {
      // 수분 목록 캐시 전체 무효화
      void queryClient.invalidateQueries({ queryKey: ['water'] })
    },
  })
}

// 수분 섭취 기록 삭제 훅
export function useDeleteWater() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/health/water/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '수분 기록 삭제 실패')
    },
    onSuccess: () => {
      // 수분 목록 캐시 전체 무효화
      void queryClient.invalidateQueries({ queryKey: ['water'] })
    },
  })
}
