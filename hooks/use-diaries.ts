'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { encrypt, decrypt } from '@/lib/crypto/encryption'
import { PIN_ENC_KEY, PIN_ENC_KEY_LEGACY } from '@/lib/constants/pin-storage-keys'
import type {
  DiaryEntry,
  DiaryEntryDecrypted,
  EmotionType,
} from '@/types/diary'

// 월별 목록 응답 타입 (감정 캘린더용)
interface DiaryListItem {
  id: string
  date: string
  emotion_tags: EmotionType[]
}

// 일기 생성 입력 타입 (클라이언트 평문 입력)
interface CreateDiaryClientInput {
  content: string
  emotion_tags: EmotionType[]
  date?: string
}

// 일기 수정 입력 타입 (클라이언트 평문 입력)
interface UpdateDiaryClientInput {
  content?: string
  emotion_tags?: EmotionType[]
}

// sessionStorage에서 암호화 키를 가져온다. 없으면 에러를 던진다.
function getEncKey(): string {
  const key = sessionStorage.getItem(PIN_ENC_KEY)
  if (!key) {
    throw new Error('암호화 키가 없습니다. PIN을 다시 입력해주세요')
  }
  return key
}

// sessionStorage에서 레거시 키를 가져온다 (구버전 데이터 복호화용).
function getLegacyEncKey(): string | undefined {
  return sessionStorage.getItem(PIN_ENC_KEY_LEGACY) ?? undefined
}

// 특정 날짜 일기 조회 훅
export function useDiary(date: string) {
  return useQuery<DiaryEntryDecrypted | null>({
    queryKey: ['diary', date],
    queryFn: async () => {
      const res = await fetch(`/api/diaries?date=${encodeURIComponent(date)}`)
      const json = await res.json() as { success: boolean; data: DiaryEntry | null; error?: string }
      if (!json.success) throw new Error(json.error ?? '일기 조회 실패')

      // 데이터 없으면 null 반환
      if (!json.data) return null

      // 복호화 처리 (v2 + 레거시 형식 모두 지원)
      const key = getEncKey()
      const decrypted = await decrypt(json.data.content_encrypted, key, getLegacyEncKey())

      return {
        id: json.data.id,
        user_id: json.data.user_id,
        date: json.data.date,
        content: decrypted,
        emotion_tags: json.data.emotion_tags,
        created_at: json.data.created_at,
        updated_at: json.data.updated_at,
      } satisfies DiaryEntryDecrypted
    },
    enabled: !!date,
    retry: false,
  })
}

// 월별 일기 목록 조회 훅 (감정 캘린더용)
export function useDiaryList(year: number, month: number) {
  return useQuery<DiaryListItem[]>({
    queryKey: ['diaries', 'list', year, month],
    queryFn: async () => {
      const res = await fetch(
        `/api/diaries/list?year=${year}&month=${month}`
      )
      const json = await res.json() as { success: boolean; data: DiaryListItem[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '일기 목록 조회 실패')
      return json.data
    },
    enabled: !!year && !!month,
  })
}

// 일기 생성 mutation 훅 (클라이언트에서 암호화 후 전송)
export function useCreateDiary() {
  const queryClient = useQueryClient()

  return useMutation<DiaryEntry, Error, CreateDiaryClientInput>({
    mutationFn: async (input) => {
      // 암호화 키 조회 → Web Crypto AES-GCM으로 암호화
      const key = getEncKey()
      const content_encrypted = await encrypt(input.content, key)

      const res = await fetch('/api/diaries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content_encrypted,
          emotion_tags: input.emotion_tags,
          date: input.date,
        }),
      })
      const json = await res.json() as { success: boolean; data: DiaryEntry; error?: string }
      if (!json.success) throw new Error(json.error ?? '일기 생성 실패')
      return json.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['diary', data.date] })
      void queryClient.invalidateQueries({ queryKey: ['diaries', 'list'] })
    },
  })
}

// 일기 수정 mutation 훅
export function useUpdateDiary() {
  const queryClient = useQueryClient()

  return useMutation<DiaryEntry, Error, { id: string; input: UpdateDiaryClientInput }>({
    mutationFn: async ({ id, input }) => {
      const updateBody: { content_encrypted?: string; emotion_tags?: EmotionType[] } = {}

      // 내용이 있으면 v2 형식으로 재암호화
      if (input.content !== undefined) {
        const key = getEncKey()
        updateBody.content_encrypted = await encrypt(input.content, key)
      }

      if (input.emotion_tags !== undefined) {
        updateBody.emotion_tags = input.emotion_tags
      }

      const res = await fetch(`/api/diaries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateBody),
      })
      const json = await res.json() as { success: boolean; data: DiaryEntry; error?: string }
      if (!json.success) throw new Error(json.error ?? '일기 수정 실패')
      return json.data
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['diary', data.date] })
      void queryClient.invalidateQueries({ queryKey: ['diaries', 'list'] })
    },
  })
}

// 일기 삭제 mutation 훅
export function useDeleteDiary() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/diaries/${id}`, { method: 'DELETE' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '일기 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['diary'] })
      void queryClient.invalidateQueries({ queryKey: ['diaries', 'list'] })
    },
  })
}
