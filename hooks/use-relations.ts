'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { encrypt, decrypt } from '@/lib/crypto/encryption'
import type { Relation, RelationDecrypted, CreateRelationInput, UpdateRelationInput } from '@/types/relation'

// sessionStorage에서 암호화 키를 가져오는 헬퍼
function getEncKey(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem('enc_key')
}

// Relation 데이터를 복호화하는 헬퍼
function decryptRelation(relation: Relation, encKey: string): RelationDecrypted {
  const { memo_encrypted, ...rest } = relation
  if (!memo_encrypted) {
    return { ...rest, memo: null }
  }
  try {
    const memo = decrypt(memo_encrypted, encKey)
    return { ...rest, memo: memo || null }
  } catch {
    // 복호화 실패 시 null 반환
    return { ...rest, memo: null }
  }
}

// 인간관계 목록 조회 훅 — 클라이언트에서 자동 복호화
export function useRelations() {
  return useQuery<RelationDecrypted[]>({
    queryKey: ['relations'],
    queryFn: async () => {
      const res = await fetch('/api/relations')
      const json = await res.json() as { success: boolean; data: Relation[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '인간관계 목록 조회 실패')

      const encKey = getEncKey()
      if (!encKey) {
        // 암호화 키 없으면 memo를 null로 반환
        return json.data.map(({ memo_encrypted, ...rest }) => ({
          ...rest,
          memo: null,
        }))
      }

      return json.data.map((relation) => decryptRelation(relation, encKey))
    },
  })
}

// 인간관계 생성 훅 — 메모를 클라이언트에서 암호화 후 전송
export function useCreateRelation() {
  const queryClient = useQueryClient()

  return useMutation<Relation, Error, CreateRelationInput>({
    mutationFn: async (input) => {
      const encKey = getEncKey()

      // memo가 있으면 암호화, 없으면 null
      let memo_encrypted: string | null = null
      if (input.memo && input.memo.trim() !== '') {
        if (!encKey) throw new Error('암호화 키가 없습니다. PIN 잠금을 해제해주세요.')
        memo_encrypted = encrypt(input.memo, encKey)
      }

      const body = {
        name: input.name,
        relationship_type: input.relationship_type,
        last_met_at: input.last_met_at ?? null,
        memo_encrypted,
      }

      const res = await fetch('/api/relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json() as { success: boolean; data: Relation; error?: string }
      if (!json.success) throw new Error(json.error ?? '인간관계 등록 실패')
      return json.data
    },
    onSuccess: () => {
      // 인간관계 목록 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: ['relations'] })
    },
  })
}

// 인간관계 수정 훅 — 메모를 클라이언트에서 암호화 후 전송
export function useUpdateRelation() {
  const queryClient = useQueryClient()

  return useMutation<Relation, Error, { id: string; input: UpdateRelationInput }>({
    mutationFn: async ({ id, input }) => {
      const encKey = getEncKey()

      // memo 필드 처리: null이면 메모 삭제, 문자열이면 암호화, undefined면 변경 없음
      const body: Record<string, unknown> = {}

      if (input.name !== undefined) body.name = input.name
      if (input.relationship_type !== undefined) body.relationship_type = input.relationship_type
      if ('last_met_at' in input) body.last_met_at = input.last_met_at ?? null

      if ('memo' in input) {
        if (input.memo === null || input.memo === undefined) {
          // 메모 삭제
          body.memo_encrypted = null
        } else if (input.memo.trim() === '') {
          // 빈 문자열 → 삭제
          body.memo_encrypted = null
        } else {
          if (!encKey) throw new Error('암호화 키가 없습니다. PIN 잠금을 해제해주세요.')
          body.memo_encrypted = encrypt(input.memo, encKey)
        }
      }

      const res = await fetch(`/api/relations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json() as { success: boolean; data: Relation; error?: string }
      if (!json.success) throw new Error(json.error ?? '인간관계 수정 실패')
      return json.data
    },
    onSuccess: () => {
      // 인간관계 목록 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: ['relations'] })
    },
  })
}

// 인간관계 삭제 훅
export function useDeleteRelation() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/relations/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '인간관계 삭제 실패')
    },
    onSuccess: () => {
      // 인간관계 목록 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: ['relations'] })
    },
  })
}
