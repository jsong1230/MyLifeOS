'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getToday } from '@/lib/date-utils'
import { enqueueRequest } from '@/lib/offline-queue'
import { useOfflineQueue } from '@/hooks/use-offline-queue'
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

// 수분 섭취 기록 추가 훅 (오프라인 큐 지원)
export function useAddWater() {
  const queryClient = useQueryClient()
  const { isOnline, refreshCount } = useOfflineQueue()

  return useMutation<WaterLog | null, Error, CreateWaterInput, { offlineQueued?: boolean }>({
    mutationFn: async (input) => {
      // 오프라인 상태: IndexedDB 큐에 저장 후 null 반환
      if (!isOnline) {
        await enqueueRequest('POST', '/api/health/water', input)
        return null
      }

      const res = await fetch('/api/health/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: WaterLog; error?: string }
      if (!json.success) throw new Error(json.error ?? '수분 기록 추가 실패')
      return json.data
    },
    onMutate: () => {
      // 오프라인 여부를 context로 전달하기 위한 플래그
      return { offlineQueued: !isOnline }
    },
    onSuccess: (_data, _vars, context) => {
      if (context?.offlineQueued) {
        // 큐 카운트 갱신 (배너 업데이트)
        refreshCount()
        return
      }
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
