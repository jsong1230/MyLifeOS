'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { TimeBlock, CreateTimeBlockInput, UpdateTimeBlockInput } from '@/types/time-block'

// 월 전체 타임블록이 있는 날짜 Set 조회 훅 (캘린더 월간 그리드 점 표시용)
export function useTimeBlockDates(month: string) {
  return useQuery<Set<string>>({
    queryKey: ['time-block-dates', month],
    queryFn: async () => {
      const res = await fetch(`/api/time-blocks?month=${month}`)
      const json = await res.json() as { success: boolean; data: TimeBlock[]; error?: string }
      if (!json.success) return new Set<string>()
      return new Set<string>(json.data.map((b) => b.date))
    },
    enabled: Boolean(month),
  })
}

// 시간 블록 목록 조회 훅 (특정 날짜)
export function useTimeBlocks(date: string) {
  return useQuery<TimeBlock[]>({
    queryKey: ['time-blocks', date],
    queryFn: async () => {
      const res = await fetch(`/api/time-blocks?date=${date}`)
      const json = await res.json() as { success: boolean; data: TimeBlock[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '시간 블록 조회 실패')
      return json.data
    },
    // 날짜가 유효한 경우에만 쿼리 실행
    enabled: Boolean(date),
  })
}

// 시간 블록 생성 훅
export function useCreateTimeBlock() {
  const queryClient = useQueryClient()

  return useMutation<TimeBlock, Error, CreateTimeBlockInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/time-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: TimeBlock; error?: string }
      if (!json.success) throw new Error(json.error ?? '시간 블록 생성 실패')
      return json.data
    },
    onSuccess: (data) => {
      // 해당 날짜의 시간 블록 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: ['time-blocks', data.date] })
    },
  })
}

// 시간 블록 수정 훅
export function useUpdateTimeBlock() {
  const queryClient = useQueryClient()

  return useMutation<TimeBlock, Error, { id: string; input: UpdateTimeBlockInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/time-blocks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: TimeBlock; error?: string }
      if (!json.success) throw new Error(json.error ?? '시간 블록 수정 실패')
      return json.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['time-blocks', data.date] })
    },
  })
}

// 시간 블록 삭제 훅
export function useDeleteTimeBlock() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string; date: string }>({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/time-blocks/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '시간 블록 삭제 실패')
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['time-blocks', variables.date] })
    },
  })
}
