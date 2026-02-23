'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Todo, CreateTodoInput, UpdateTodoInput, ReorderTodoInput } from '@/types/todo'

// 할일 목록 조회 파라미터
interface UseTodosParams {
  date?: string   // YYYY-MM-DD
  month?: string  // YYYY-MM
}

// 할일 목록 조회 훅
export function useTodos(params?: UseTodosParams) {
  const query = params?.date
    ? `date=${params.date}`
    : params?.month
      ? `month=${params.month}`
      : ''

  return useQuery<Todo[]>({
    queryKey: ['todos', params],
    queryFn: async () => {
      const res = await fetch(`/api/todos${query ? `?${query}` : ''}`)
      const json = await res.json() as { success: boolean; data: Todo[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '할일 조회 실패')
      return json.data
    },
  })
}

// 할일 생성 훅
export function useCreateTodo() {
  const queryClient = useQueryClient()

  return useMutation<Todo, Error, CreateTodoInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: Todo; error?: string }
      if (!json.success) throw new Error(json.error ?? '할일 생성 실패')
      return json.data
    },
    onSuccess: () => {
      // 할일 목록 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

// 할일 수정 훅
export function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation<Todo, Error, { id: string; input: UpdateTodoInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: Todo; error?: string }
      if (!json.success) throw new Error(json.error ?? '할일 수정 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

// 할일 삭제 훅
export function useDeleteTodo() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '할일 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}

// 할일 순서 변경 훅
export function useReorderTodos() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, ReorderTodoInput[]>({
    mutationFn: async (items) => {
      const res = await fetch('/api/todos/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '순서 변경 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
