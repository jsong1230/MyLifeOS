'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  RecurringExpense,
  CreateRecurringInput,
  UpdateRecurringInput,
} from '@/types/recurring'

// API 응답 타입
interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// 정기 지출 목록 조회 훅
export function useRecurring() {
  return useQuery<RecurringExpense[]>({
    queryKey: ['recurring'],
    queryFn: async () => {
      const res = await fetch('/api/recurring')
      const json = (await res.json()) as ApiResponse<RecurringExpense[]>
      if (!json.success) throw new Error(json.error ?? '정기 지출 목록 조회 실패')
      return json.data
    },
  })
}

// 정기 지출 등록 훅
export function useCreateRecurring() {
  const queryClient = useQueryClient()

  return useMutation<RecurringExpense, Error, CreateRecurringInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/recurring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = (await res.json()) as ApiResponse<RecurringExpense>
      if (!json.success) throw new Error(json.error ?? '정기 지출 등록 실패')
      return json.data
    },
    onSuccess: () => {
      // 정기 지출 목록 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: ['recurring'] })
    },
  })
}

// 정기 지출 수정 훅
export function useUpdateRecurring() {
  const queryClient = useQueryClient()

  return useMutation<RecurringExpense, Error, { id: string; input: UpdateRecurringInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/recurring/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = (await res.json()) as ApiResponse<RecurringExpense>
      if (!json.success) throw new Error(json.error ?? '정기 지출 수정 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring'] })
    },
  })
}

// 정기 지출 삭제 훅
export function useDeleteRecurring() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' })
      const json = (await res.json()) as ApiResponse<null>
      if (!json.success) throw new Error(json.error ?? '정기 지출 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recurring'] })
    },
  })
}
