'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  BudgetStatus,
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
} from '@/types/budget'

// API 응답 타입
interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

/**
 * 특정 월의 예산 + 지출 현황 목록 조회 훅
 * @param month - YYYY-MM 형식 (미입력 시 서버에서 현재 월 사용)
 */
export function useBudgets(month?: string) {
  const queryString = month ? `?month=${month}` : ''

  return useQuery<BudgetStatus[]>({
    queryKey: ['budgets', month],
    queryFn: async () => {
      const res = await fetch(`/api/budgets${queryString}`)
      const json = (await res.json()) as ApiResponse<BudgetStatus[]>
      if (!json.success) throw new Error(json.error ?? '예산 조회 실패')
      return json.data
    },
  })
}

/**
 * 예산 생성/수정(upsert) mutation 훅
 * 같은 user + category + month 조합이면 서버에서 업데이트 처리
 */
export function useUpsertBudget() {
  const queryClient = useQueryClient()

  return useMutation<Budget, Error, CreateBudgetInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = (await res.json()) as ApiResponse<Budget>
      if (!json.success) throw new Error(json.error ?? '예산 저장 실패')
      return json.data
    },
    onSuccess: () => {
      // 예산 목록 캐시 전체 무효화 (월 무관)
      void queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

/**
 * 예산 삭제 mutation 훅
 */
export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/budgets/${id}`, { method: 'DELETE' })
      const json = (await res.json()) as ApiResponse<null>
      if (!json.success) throw new Error(json.error ?? '예산 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}

/**
 * 예산 금액 수정 mutation 훅 (PATCH /api/budgets/[id])
 */
export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation<Budget, Error, { id: string; input: UpdateBudgetInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/budgets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = (await res.json()) as ApiResponse<Budget>
      if (!json.success) throw new Error(json.error ?? '예산 수정 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
  })
}
