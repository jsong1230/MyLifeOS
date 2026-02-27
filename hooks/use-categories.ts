'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Category, CategoryType, CreateCategoryInput, UpdateCategoryInput } from '@/types/category'

// API 응답 타입
interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// 카테고리 목록 조회 훅
// type 파라미터로 특정 타입만 필터링 가능
export function useCategories(type?: CategoryType) {
  const queryParam = type ? `?type=${type}` : ''

  return useQuery<Category[]>({
    queryKey: ['categories', type],
    queryFn: async () => {
      const res = await fetch(`/api/categories${queryParam}`)
      const json = await res.json() as ApiResponse<Category[]>
      if (!json.success) throw new Error(json.error ?? '카테고리 조회 실패')
      return json.data
    },
    staleTime: 30 * 60 * 1000, // 30분 — 카테고리는 자주 변하지 않음
  })
}

// 카테고리 생성 훅
export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation<Category, Error, CreateCategoryInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as ApiResponse<Category>
      if (!json.success) throw new Error(json.error ?? '카테고리 생성 실패')
      return json.data
    },
    onSuccess: () => {
      // 모든 카테고리 쿼리 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// 카테고리 수정 훅
export function useUpdateCategory() {
  const queryClient = useQueryClient()

  return useMutation<Category, Error, { id: string; input: UpdateCategoryInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as ApiResponse<Category>
      if (!json.success) throw new Error(json.error ?? '카테고리 수정 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}

// 카테고리 삭제 훅
// 409 Conflict 시 에러 메시지에 사용 중 거래 수 포함
export function useDeleteCategory() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      const json = await res.json() as ApiResponse<null>
      if (!json.success) throw new Error(json.error ?? '카테고리 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
  })
}
