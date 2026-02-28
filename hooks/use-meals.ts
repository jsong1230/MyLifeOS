'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getToday } from '@/lib/date-utils'
import type { MealLog, CreateMealInput, UpdateMealInput } from '@/types/health'

// 날짜별 식사 목록 조회 훅 (쿼리 키: ['meals', date])
export function useMeals(date?: string) {
  const queryDate = date ?? getToday()

  return useQuery<MealLog[]>({
    queryKey: ['meals', queryDate],
    queryFn: async () => {
      const res = await fetch(`/api/health/meals?date=${queryDate}`)
      const json = await res.json() as { success: boolean; data: MealLog[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '식사 목록 조회 실패')
      return json.data
    },
  })
}

// 식사 기록 생성 훅
export function useCreateMeal() {
  const queryClient = useQueryClient()

  return useMutation<MealLog, Error, CreateMealInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/health/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: MealLog; error?: string }
      if (!json.success) throw new Error(json.error ?? '식사 기록 생성 실패')
      return json.data
    },
    onSuccess: () => {
      // 식사 목록 캐시 전체 무효화
      void queryClient.invalidateQueries({ queryKey: ['meals'] })
    },
  })
}

// 식사 기록 수정 훅
export function useUpdateMeal() {
  const queryClient = useQueryClient()

  return useMutation<MealLog, Error, { id: string; input: UpdateMealInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/health/meals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: MealLog; error?: string }
      if (!json.success) throw new Error(json.error ?? '식사 기록 수정 실패')
      return json.data
    },
    onSuccess: () => {
      // 식사 목록 캐시 전체 무효화
      void queryClient.invalidateQueries({ queryKey: ['meals'] })
    },
  })
}

// 식사 기록 삭제 훅
export function useDeleteMeal() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/health/meals/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '식사 기록 삭제 실패')
    },
    onSuccess: () => {
      // 식사 목록 캐시 전체 무효화
      void queryClient.invalidateQueries({ queryKey: ['meals'] })
    },
  })
}
