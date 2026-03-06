'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ShoppingList,
  ShoppingListSummary,
  CreateShoppingListInput,
  CreateShoppingItemInput,
  ShoppingItem,
} from '@/types/shopping'

// 장보기 목록 목록 조회
export function useShoppingLists() {
  return useQuery<ShoppingListSummary[]>({
    queryKey: ['shopping-lists'],
    queryFn: async () => {
      const res = await fetch('/api/money/shopping')
      const json = await res.json() as { success: boolean; data: ShoppingListSummary[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '장보기 목록 조회 실패')
      return json.data
    },
  })
}

// 장보기 목록 단건 + 아이템 조회
export function useShoppingList(id: string) {
  return useQuery<ShoppingList>({
    queryKey: ['shopping-lists', id],
    queryFn: async () => {
      const res = await fetch(`/api/money/shopping/${id}`)
      const json = await res.json() as { success: boolean; data: ShoppingList; error?: string }
      if (!json.success) throw new Error(json.error ?? '장보기 목록 조회 실패')
      return json.data
    },
    enabled: !!id,
  })
}

// 장보기 목록 생성
export function useCreateShoppingList() {
  const queryClient = useQueryClient()

  return useMutation<ShoppingList, Error, CreateShoppingListInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/money/shopping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: ShoppingList; error?: string }
      if (!json.success) throw new Error(json.error ?? '장보기 목록 생성 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shopping-lists'] })
    },
  })
}

// 장보기 목록 수정
export function useUpdateShoppingList() {
  const queryClient = useQueryClient()

  return useMutation<ShoppingList, Error, { id: string; input: Partial<Pick<ShoppingList, 'name' | 'budget' | 'currency' | 'is_completed'>> }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/money/shopping/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: ShoppingList; error?: string }
      if (!json.success) throw new Error(json.error ?? '장보기 목록 수정 실패')
      return json.data
    },
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['shopping-lists'] })
      void queryClient.invalidateQueries({ queryKey: ['shopping-lists', id] })
    },
  })
}

// 장보기 목록 삭제
export function useDeleteShoppingList() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/money/shopping/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '장보기 목록 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['shopping-lists'] })
    },
  })
}

// 아이템 추가
export function useAddShoppingItem() {
  const queryClient = useQueryClient()

  return useMutation<ShoppingItem, Error, CreateShoppingItemInput>({
    mutationFn: async (input) => {
      const res = await fetch(`/api/money/shopping/${input.list_id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: ShoppingItem; error?: string }
      if (!json.success) throw new Error(json.error ?? '아이템 추가 실패')
      return json.data
    },
    onSuccess: (item) => {
      void queryClient.invalidateQueries({ queryKey: ['shopping-lists'] })
      void queryClient.invalidateQueries({ queryKey: ['shopping-lists', item.list_id] })
    },
  })
}

// 아이템 수정 (체크/가격 등)
export function useUpdateShoppingItem() {
  const queryClient = useQueryClient()

  return useMutation<ShoppingItem, Error, {
    listId: string
    itemId: string
    input: Partial<Pick<ShoppingItem, 'name' | 'quantity' | 'unit' | 'estimated_price' | 'actual_price' | 'category' | 'is_checked' | 'sort_order'>>
  }>({
    mutationFn: async ({ listId, itemId, input }) => {
      const res = await fetch(`/api/money/shopping/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: ShoppingItem; error?: string }
      if (!json.success) throw new Error(json.error ?? '아이템 수정 실패')
      return json.data
    },
    onSuccess: (item) => {
      void queryClient.invalidateQueries({ queryKey: ['shopping-lists'] })
      void queryClient.invalidateQueries({ queryKey: ['shopping-lists', item.list_id] })
    },
  })
}

// 아이템 삭제
export function useDeleteShoppingItem() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, { listId: string; itemId: string }>({
    mutationFn: async ({ listId, itemId }) => {
      const res = await fetch(`/api/money/shopping/${listId}/items/${itemId}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '아이템 삭제 실패')
    },
    onSuccess: (_, { listId }) => {
      void queryClient.invalidateQueries({ queryKey: ['shopping-lists'] })
      void queryClient.invalidateQueries({ queryKey: ['shopping-lists', listId] })
    },
  })
}
