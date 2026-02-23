'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  Routine,
  RoutineWithLog,
  CreateRoutineInput,
  UpdateRoutineInput,
} from '@/types/routine'

// API 응답 타입 정의
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// 루틴 목록 조회 API 호출
async function fetchRoutines(date?: string): Promise<RoutineWithLog[]> {
  const params = date ? `?date=${date}` : ''
  const res = await fetch(`/api/routines${params}`)
  const json = (await res.json()) as ApiResponse<RoutineWithLog[]>

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? '루틴 목록 조회에 실패했습니다')
  }
  return json.data ?? []
}

// 루틴 생성 API 호출
async function createRoutineApi(input: CreateRoutineInput): Promise<Routine> {
  const res = await fetch('/api/routines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = (await res.json()) as ApiResponse<Routine>

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? '루틴 생성에 실패했습니다')
  }
  return json.data!
}

// 루틴 수정 API 호출
async function updateRoutineApi({
  id,
  input,
}: {
  id: string
  input: UpdateRoutineInput
}): Promise<Routine> {
  const res = await fetch(`/api/routines/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = (await res.json()) as ApiResponse<Routine>

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? '루틴 수정에 실패했습니다')
  }
  return json.data!
}

// 루틴 삭제 API 호출
async function deleteRoutineApi(id: string): Promise<void> {
  const res = await fetch(`/api/routines/${id}`, {
    method: 'DELETE',
  })
  const json = (await res.json()) as ApiResponse<unknown>

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? '루틴 삭제에 실패했습니다')
  }
}

// 체크인 토글 API 호출
async function toggleRoutineApi({
  routineId,
  date,
  completed,
}: {
  routineId: string
  date: string
  completed: boolean
}): Promise<{ log: unknown; streak: number }> {
  const res = await fetch('/api/routines/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ routineId, date, completed }),
  })
  const json = (await res.json()) as ApiResponse<{ log: unknown; streak: number }>

  if (!res.ok || !json.success) {
    throw new Error(json.error ?? '체크인 처리에 실패했습니다')
  }
  return json.data!
}

/**
 * 오늘의 루틴 + 로그 목록 조회 훅
 * @param date - 조회 날짜 (YYYY-MM-DD, 기본값: 오늘)
 */
export function useRoutines(date?: string) {
  return useQuery<RoutineWithLog[], Error>({
    queryKey: ['routines', date ?? 'today'],
    queryFn: () => fetchRoutines(date),
  })
}

/**
 * 루틴 생성 mutation 훅
 */
export function useCreateRoutine() {
  const queryClient = useQueryClient()

  return useMutation<Routine, Error, CreateRoutineInput>({
    mutationFn: createRoutineApi,
    onSuccess: () => {
      // 루틴 관련 모든 쿼리 무효화
      void queryClient.invalidateQueries({ queryKey: ['routines'] })
    },
  })
}

/**
 * 루틴 수정 mutation 훅
 */
export function useUpdateRoutine() {
  const queryClient = useQueryClient()

  return useMutation<Routine, Error, { id: string; input: UpdateRoutineInput }>({
    mutationFn: updateRoutineApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['routines'] })
    },
  })
}

/**
 * 루틴 삭제 mutation 훅
 */
export function useDeleteRoutine() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: deleteRoutineApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['routines'] })
    },
  })
}

/**
 * 루틴 체크인 토글 mutation 훅
 * @param routineId - 루틴 ID
 * @param date - 날짜 (YYYY-MM-DD)
 * @param completed - 완료 여부
 */
export function useToggleRoutine() {
  const queryClient = useQueryClient()

  return useMutation<
    { log: unknown; streak: number },
    Error,
    { routineId: string; date: string; completed: boolean }
  >({
    mutationFn: toggleRoutineApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['routines'] })
    },
  })
}
