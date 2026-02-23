'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Transaction, CreateTransactionInput, UpdateTransactionInput, TransactionFilter } from '@/types/transaction'

// 필터 객체를 쿼리스트링으로 변환
function buildQueryString(filter?: TransactionFilter): string {
  if (!filter) return ''
  const params = new URLSearchParams()

  if (filter.month) params.set('month', filter.month)
  if (filter.type) params.set('type', filter.type)
  if (filter.category_id) params.set('category_id', filter.category_id)
  if (filter.date_from) params.set('date_from', filter.date_from)
  if (filter.date_to) params.set('date_to', filter.date_to)
  if (filter.is_favorite === true) params.set('is_favorite', 'true')

  return params.toString()
}

// 거래 목록 조회 훅
export function useTransactions(filter?: TransactionFilter) {
  const qs = buildQueryString(filter)

  return useQuery<Transaction[]>({
    queryKey: ['transactions', filter],
    queryFn: async () => {
      const res = await fetch(`/api/transactions${qs ? `?${qs}` : ''}`)
      const json = await res.json() as { success: boolean; data: Transaction[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '거래 목록 조회 실패')
      return json.data
    },
  })
}

// 거래 생성 훅
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation<Transaction, Error, CreateTransactionInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: Transaction; error?: string }
      if (!json.success) throw new Error(json.error ?? '거래 생성 실패')
      return json.data
    },
    onSuccess: () => {
      // 거래 목록 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

// 거래 수정 훅
export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation<Transaction, Error, { id: string; input: UpdateTransactionInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: Transaction; error?: string }
      if (!json.success) throw new Error(json.error ?? '거래 수정 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

// 거래 삭제 훅
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '거래 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
