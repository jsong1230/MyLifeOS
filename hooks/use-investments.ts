'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Investment,
  InvestmentWithTransactions,
  InvestmentTransaction,
  CreateInvestmentInput,
  UpdateInvestmentInput,
  CreateTradeInput,
} from '@/types/investment'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// 종목 목록 조회
export function useInvestments() {
  return useQuery<Investment[]>({
    queryKey: ['investments'],
    queryFn: async () => {
      const res = await fetch('/api/investments')
      const json = await res.json() as ApiResponse<Investment[]>
      if (!json.success) throw new Error(json.error ?? '투자 목록 조회 실패')
      return json.data
    },
  })
}

// 종목 상세 조회 (거래 내역 포함)
export function useInvestment(id: string) {
  return useQuery<InvestmentWithTransactions>({
    queryKey: ['investments', id],
    queryFn: async () => {
      const res = await fetch(`/api/investments/${id}`)
      const json = await res.json() as ApiResponse<InvestmentWithTransactions>
      if (!json.success) throw new Error(json.error ?? '투자 상세 조회 실패')
      return json.data
    },
    enabled: Boolean(id),
  })
}

// 종목 추가
export function useCreateInvestment() {
  const queryClient = useQueryClient()

  return useMutation<Investment, Error, CreateInvestmentInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as ApiResponse<Investment>
      if (!json.success) throw new Error(json.error ?? '종목 추가 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['investments'] })
    },
  })
}

// 종목 수정
export function useUpdateInvestment() {
  const queryClient = useQueryClient()

  return useMutation<Investment, Error, { id: string; input: UpdateInvestmentInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/investments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as ApiResponse<Investment>
      if (!json.success) throw new Error(json.error ?? '종목 수정 실패')
      return json.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['investments'] })
      void queryClient.invalidateQueries({ queryKey: ['investments', data.id] })
    },
  })
}

// 종목 삭제
export function useDeleteInvestment() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/investments/${id}`, { method: 'DELETE' })
      const json = await res.json() as ApiResponse<null>
      if (!json.success) throw new Error(json.error ?? '종목 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['investments'] })
    },
  })
}

// 매수/매도 거래 추가
export function useCreateTrade(investmentId: string) {
  const queryClient = useQueryClient()

  return useMutation<InvestmentTransaction, Error, CreateTradeInput>({
    mutationFn: async (input) => {
      const res = await fetch(`/api/investments/${investmentId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as ApiResponse<InvestmentTransaction>
      if (!json.success) throw new Error(json.error ?? '거래 추가 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['investments', investmentId] })
      void queryClient.invalidateQueries({ queryKey: ['investments'] })
    },
  })
}

// 거래 내역 삭제
export function useDeleteTrade(investmentId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (txId) => {
      const res = await fetch(`/api/investments/${investmentId}/transactions/${txId}`, {
        method: 'DELETE',
      })
      const json = await res.json() as ApiResponse<null>
      if (!json.success) throw new Error(json.error ?? '거래 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['investments', investmentId] })
      void queryClient.invalidateQueries({ queryKey: ['investments'] })
    },
  })
}
