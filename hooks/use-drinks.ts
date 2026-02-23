'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DrinkLog, CreateDrinkInput, UpdateDrinkInput } from '@/types/health'

// API 응답 타입 — summary 포함
interface DrinksApiResponse {
  success: boolean
  data: DrinkLog[]
  summary: {
    count: number
    total_ml: number
  }
  week_start?: string
  week_end?: string
  error?: string
}

interface DrinkApiResponse {
  success: boolean
  data: DrinkLog
  error?: string
}

interface DeleteApiResponse {
  success: boolean
  error?: string
}

// 음주 주간 조회 결과 타입
export interface DrinksQueryResult {
  data: DrinkLog[]
  summary: {
    count: number
    total_ml: number
  }
  week_start?: string
  week_end?: string
}

// 이번 주 시작일(월요일) 기준 음주 기록 조회 훅
// queryKey: ['drinks', weekStart] — weekStart 미전달 시 undefined로 현재 주 조회
export function useDrinks(weekStart?: string) {
  return useQuery<DrinksQueryResult>({
    queryKey: ['drinks', weekStart],
    queryFn: async () => {
      const qs = weekStart ? `?week=${weekStart}` : ''
      const res = await fetch(`/api/health/drinks${qs}`)
      const json = (await res.json()) as DrinksApiResponse
      if (!json.success) throw new Error(json.error ?? '음주 기록 조회 실패')
      return {
        data: json.data,
        summary: json.summary,
        week_start: json.week_start,
        week_end: json.week_end,
      }
    },
  })
}

// 음주 기록 생성 훅
export function useCreateDrink() {
  const queryClient = useQueryClient()

  return useMutation<DrinkLog, Error, CreateDrinkInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/health/drinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = (await res.json()) as DrinkApiResponse
      if (!json.success) throw new Error(json.error ?? '음주 기록 생성 실패')
      return json.data
    },
    onSuccess: () => {
      // 모든 drinks 캐시 무효화 (주 전환 시에도 최신 데이터 유지)
      void queryClient.invalidateQueries({ queryKey: ['drinks'] })
    },
  })
}

// 음주 기록 수정 훅
export function useUpdateDrink() {
  const queryClient = useQueryClient()

  return useMutation<DrinkLog, Error, { id: string; input: UpdateDrinkInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/health/drinks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = (await res.json()) as DrinkApiResponse
      if (!json.success) throw new Error(json.error ?? '음주 기록 수정 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['drinks'] })
    },
  })
}

// 음주 기록 삭제 훅
export function useDeleteDrink() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/health/drinks/${id}`, { method: 'DELETE' })
      const json = (await res.json()) as DeleteApiResponse
      if (!json.success) throw new Error(json.error ?? '음주 기록 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['drinks'] })
    },
  })
}
