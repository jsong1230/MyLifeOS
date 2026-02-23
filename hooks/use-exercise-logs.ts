'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ExerciseLog, CreateExerciseInput, UpdateExerciseInput } from '@/types/health'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

// 로컬 날짜 YYYY-MM-DD
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 해당 날짜의 주 월요일 반환
function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  return toLocalDateStr(monday)
}

// 이번 주 월요일
export function getCurrentWeekStart(): string {
  return getWeekStart(toLocalDateStr(new Date()))
}

// 주간 운동 기록 조회
export function useExerciseLogs(weekStart: string) {
  return useQuery<ExerciseLog[]>({
    queryKey: ['exercise-logs', weekStart],
    queryFn: async () => {
      const res = await fetch(`/api/health/exercise?week_start=${weekStart}`)
      const json = await res.json() as ApiResponse<ExerciseLog[]>
      if (!json.success) throw new Error(json.error ?? '운동 기록 조회 실패')
      return json.data
    },
  })
}

// 운동 기록 추가
export function useCreateExerciseLog() {
  const queryClient = useQueryClient()

  return useMutation<ExerciseLog, Error, CreateExerciseInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/health/exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as ApiResponse<ExerciseLog>
      if (!json.success) throw new Error(json.error ?? '운동 기록 추가 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exercise-logs'] })
    },
  })
}

// 운동 기록 수정
export function useUpdateExerciseLog() {
  const queryClient = useQueryClient()

  return useMutation<ExerciseLog, Error, { id: string; input: UpdateExerciseInput }>({
    mutationFn: async ({ id, input }) => {
      const res = await fetch(`/api/health/exercise/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as ApiResponse<ExerciseLog>
      if (!json.success) throw new Error(json.error ?? '운동 기록 수정 실패')
      return json.data
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exercise-logs'] })
    },
  })
}

// 운동 기록 삭제
export function useDeleteExerciseLog() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/health/exercise/${id}`, { method: 'DELETE' })
      const json = await res.json() as ApiResponse<null>
      if (!json.success) throw new Error(json.error ?? '운동 기록 삭제 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['exercise-logs'] })
    },
  })
}
