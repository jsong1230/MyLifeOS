'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { encrypt } from '@/lib/crypto/encryption'
import { PIN_ENC_KEY } from '@/lib/constants/pin-storage-keys'
import type { QuickMemo, CreateMemoInput, UpdateMemoInput } from '@/types/memo'

// sessionStorage에서 암호화 키를 가져오는 헬퍼
function getEncKey(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(PIN_ENC_KEY)
}

// GET /api/private/memos — 암호화된 원본 목록 조회 (복호화는 컴포넌트에서)
export function useRawMemos() {
  return useQuery<QuickMemo[]>({
    queryKey: ['memos'],
    queryFn: async () => {
      const res = await fetch('/api/private/memos')
      const json = await res.json() as { success: boolean; data: QuickMemo[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '퀵 메모 목록 조회 실패')
      return json.data
    },
  })
}

// POST /api/private/memos — 메모 생성 (클라이언트에서 encrypt 후 호출)
export function useCreateMemo() {
  const queryClient = useQueryClient()

  return useMutation<QuickMemo, Error, CreateMemoInput>({
    mutationFn: async (input) => {
      const encKey = getEncKey()
      if (!encKey) throw new Error('암호화 키가 없습니다. PIN 잠금을 해제해주세요.')

      // 메모 내용을 v2 형식으로 암호화
      const content_encrypted = await encrypt(input.content, encKey)

      const res = await fetch('/api/private/memos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_encrypted,
          is_pinned: input.is_pinned ?? false,
          color: input.color ?? 'default',
        }),
      })
      const json = await res.json() as { success: boolean; data: QuickMemo; error?: string }
      if (!json.success) throw new Error(json.error ?? '퀵 메모 저장 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['memos'] })
    },
  })
}

// PATCH /api/private/memos/[id] — 메모 수정
export function useUpdateMemo() {
  const queryClient = useQueryClient()

  return useMutation<QuickMemo, Error, { id: string; input: UpdateMemoInput }>({
    mutationFn: async ({ id, input }) => {
      const body: Record<string, unknown> = {}

      // content가 있으면 암호화 후 전송
      if (input.content !== undefined) {
        const encKey = getEncKey()
        if (!encKey) throw new Error('암호화 키가 없습니다. PIN 잠금을 해제해주세요.')
        body.content_encrypted = await encrypt(input.content, encKey)
      }

      if (input.is_pinned !== undefined) {
        body.is_pinned = input.is_pinned
      }
      if (input.color !== undefined) {
        body.color = input.color
      }

      const res = await fetch(`/api/private/memos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json() as { success: boolean; data: QuickMemo; error?: string }
      if (!json.success) throw new Error(json.error ?? '퀵 메모 수정 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['memos'] })
    },
  })
}

// DELETE /api/private/memos/[id] — 메모 삭제
export function useDeleteMemo() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/private/memos/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '퀵 메모 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['memos'] })
    },
  })
}
