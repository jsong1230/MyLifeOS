'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Book, BookStatus, CreateBookInput, UpdateBookInput } from '@/types/book'

interface BooksResponse {
  success: boolean
  data: Book[]
  stats: {
    total: number
    reading: number
    completed: number
  }
  error?: string
}

// 독서 목록 조회 훅
export function useBooks(status?: BookStatus) {
  return useQuery<BooksResponse>({
    queryKey: ['books', status],
    queryFn: async () => {
      const url = status ? `/api/books?status=${status}` : '/api/books'
      const res = await fetch(url)
      const json = await res.json() as BooksResponse
      if (!json.success) throw new Error(json.error ?? '독서 목록 조회 실패')
      return json
    },
  })
}

// 단건 조회 훅
export function useBook(id: string) {
  return useQuery<Book>({
    queryKey: ['books', 'detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/books/${id}`)
      const json = await res.json() as { success: boolean; data: Book; error?: string }
      if (!json.success) throw new Error(json.error ?? '책 조회 실패')
      return json.data
    },
    enabled: !!id,
  })
}

// 책 등록 훅
export function useCreateBook() {
  const queryClient = useQueryClient()

  return useMutation<Book, Error, CreateBookInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: Book; error?: string }
      if (!json.success) throw new Error(json.error ?? '책 등록 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// 책 수정 훅 (페이지 업데이트, 상태 변경 포함)
export function useUpdateBook() {
  const queryClient = useQueryClient()

  return useMutation<Book, Error, { id: string; input: UpdateBookInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/books/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: Book; error?: string }
      if (!json.success) throw new Error(json.error ?? '책 수정 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

// 책 삭제 훅
export function useDeleteBook() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '책 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['books'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
