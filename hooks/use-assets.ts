'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Asset, CreateAssetInput, UpdateAssetInput, AssetMonthlyTotal } from '@/types/asset'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// 특정 월 자산 목록 조회
export function useAssets(month: string) {
  return useQuery<Asset[]>({
    queryKey: ['assets', month],
    queryFn: async () => {
      const res = await fetch(`/api/assets?month=${month}`)
      const json = await res.json() as ApiResponse<Asset[]>
      if (!json.success) throw new Error(json.error ?? '자산 조회 실패')
      return json.data
    },
    enabled: /^\d{4}-\d{2}$/.test(month),
  })
}

// 월별 자산 합계 트렌드 (최근 N개월)
export function useAssetTrend(months = 6) {
  return useQuery<AssetMonthlyTotal[]>({
    queryKey: ['assets', 'trend', months],
    queryFn: async () => {
      const res = await fetch(`/api/assets?trend=${months}`)
      const json = await res.json() as ApiResponse<AssetMonthlyTotal[]>
      if (!json.success) throw new Error(json.error ?? '자산 트렌드 조회 실패')
      return json.data
    },
  })
}

// 자산 추가
export function useCreateAsset() {
  const queryClient = useQueryClient()

  return useMutation<Asset, Error, CreateAssetInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as ApiResponse<Asset>
      if (!json.success) throw new Error(json.error ?? '자산 추가 실패')
      return json.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['assets', data.month] })
      void queryClient.invalidateQueries({ queryKey: ['assets', 'trend'] })
    },
  })
}

// 자산 수정
export function useUpdateAsset() {
  const queryClient = useQueryClient()

  return useMutation<Asset, Error, { id: string; input: UpdateAssetInput; month: string }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as ApiResponse<Asset>
      if (!json.success) throw new Error(json.error ?? '자산 수정 실패')
      return json.data
    },
    onSuccess: (_, { month }) => {
      void queryClient.invalidateQueries({ queryKey: ['assets', month] })
      void queryClient.invalidateQueries({ queryKey: ['assets', 'trend'] })
    },
  })
}

// 자산 삭제
export function useDeleteAsset() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { id: string; month: string }>({
    mutationFn: async ({ id }) => {
      const res = await fetch(`/api/assets/${id}`, { method: 'DELETE' })
      const json = await res.json() as ApiResponse<null>
      if (!json.success) throw new Error(json.error ?? '자산 삭제 실패')
    },
    onSuccess: (_, { month }) => {
      void queryClient.invalidateQueries({ queryKey: ['assets', month] })
      void queryClient.invalidateQueries({ queryKey: ['assets', 'trend'] })
    },
  })
}

// 월별 지출 추이 (F-22)
export function useMonthlyStats(months = 6) {
  return useQuery<{ month: string; income: number; expense: number }[]>({
    queryKey: ['transactions', 'monthly-stats', months],
    queryFn: async () => {
      const res = await fetch(`/api/transactions/monthly-stats?months=${months}`)
      const json = await res.json() as ApiResponse<{ month: string; income: number; expense: number }[]>
      if (!json.success) throw new Error(json.error ?? '월별 통계 조회 실패')
      return json.data
    },
  })
}
