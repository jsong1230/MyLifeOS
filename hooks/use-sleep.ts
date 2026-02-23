'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SleepLog, CreateSleepInput, UpdateSleepInput } from '@/types/health'

// API 응답 타입 — summary 포함
interface SleepApiResponse {
  success: boolean
  data: SleepLog[]
  summary: {
    avg_hours: number
    avg_quality: number
    week_start: string
    week_end: string
  }
  error?: string
}

// 수면 주간 조회 결과 타입
export interface SleepQueryResult {
  data: SleepLog[]
  summary: {
    avg_hours: number
    avg_quality: number
    week_start: string
    week_end: string
  }
}

// 이번 주 시작일(월요일) 기준 수면 기록 조회 훅
// weekStart: 주 시작일 (YYYY-MM-DD), 기본값은 서버에서 이번 주 월요일 계산
export function useSleep(weekStart?: string) {
  return useQuery<SleepQueryResult>({
    queryKey: ['sleep', weekStart ?? 'current'],
    queryFn: async () => {
      const qs = weekStart ? `?week=${weekStart}` : ''
      const res = await fetch(`/api/health/sleep${qs}`)
      const json = (await res.json()) as SleepApiResponse
      if (!json.success) throw new Error(json.error ?? '수면 기록 조회 실패')
      return {
        data: json.data,
        summary: json.summary,
      }
    },
  })
}

// 수면 기록 생성 훅
export function useCreateSleep() {
  const queryClient = useQueryClient()

  return useMutation<SleepLog, Error, CreateSleepInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/health/sleep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = (await res.json()) as {
        success: boolean
        data: SleepLog
        error?: string
      }
      if (!json.success) throw new Error(json.error ?? '수면 기록 생성 실패')
      return json.data
    },
    onSuccess: () => {
      // 수면 관련 모든 쿼리 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: ['sleep'] })
    },
  })
}

// 수면 기록 수정 훅
export function useUpdateSleep() {
  const queryClient = useQueryClient()

  return useMutation<SleepLog, Error, { id: string; input: UpdateSleepInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/health/sleep/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = (await res.json()) as {
        success: boolean
        data: SleepLog
        error?: string
      }
      if (!json.success) throw new Error(json.error ?? '수면 기록 수정 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sleep'] })
    },
  })
}

// 수면 기록 삭제 훅
export function useDeleteSleep() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/health/sleep/${id}`, { method: 'DELETE' })
      const json = (await res.json()) as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '수면 기록 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sleep'] })
    },
  })
}
