'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { BodyLog, CreateBodyLogInput, UpdateBodyLogInput } from '@/types/health'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// 체중 기록 목록 조회 (최근 N개)
export function useBodyLogs(limit = 30) {
  return useQuery<BodyLog[]>({
    queryKey: ['body-logs', limit],
    queryFn: async () => {
      const res = await fetch(`/api/health/body?limit=${limit}`)
      const json = await res.json() as ApiResponse<BodyLog[]>
      if (!json.success) throw new Error(json.error ?? '체중 기록 조회 실패')
      return json.data
    },
  })
}

// 체중 기록 추가
export function useCreateBodyLog() {
  const queryClient = useQueryClient()

  return useMutation<BodyLog, Error, CreateBodyLogInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/health/body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as ApiResponse<BodyLog>
      if (!json.success) throw new Error(json.error ?? '체중 기록 추가 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['body-logs'] })
    },
  })
}

// 체중 기록 수정
export function useUpdateBodyLog() {
  const queryClient = useQueryClient()

  return useMutation<BodyLog, Error, { id: string; input: UpdateBodyLogInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/health/body/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as ApiResponse<BodyLog>
      if (!json.success) throw new Error(json.error ?? '체중 기록 수정 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['body-logs'] })
    },
  })
}

// 체중 기록 삭제
export function useDeleteBodyLog() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/health/body/${id}`, { method: 'DELETE' })
      const json = await res.json() as ApiResponse<null>
      if (!json.success) throw new Error(json.error ?? '체중 기록 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['body-logs'] })
    },
  })
}
