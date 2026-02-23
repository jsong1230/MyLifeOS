'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { DietGoal, UpsertDietGoalInput } from '@/types/diet-goal'

// 식단 목표 조회 훅 (쿼리 키: ['diet-goal'])
export function useDietGoal() {
  return useQuery<DietGoal | null>({
    queryKey: ['diet-goal'],
    queryFn: async () => {
      const res = await fetch('/api/health/diet-goal')
      const json = await res.json() as { success: boolean; data: DietGoal | null; error?: string }
      if (!json.success) throw new Error(json.error ?? '식단 목표 조회 실패')
      return json.data
    },
  })
}

// 식단 목표 upsert 훅
export function useUpsertDietGoal() {
  const queryClient = useQueryClient()

  return useMutation<DietGoal, Error, UpsertDietGoalInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/health/diet-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: DietGoal; error?: string }
      if (!json.success) throw new Error(json.error ?? '식단 목표 저장 실패')
      return json.data
    },
    onSuccess: () => {
      // 식단 목표 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: ['diet-goal'] })
    },
  })
}
