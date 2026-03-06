'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getToday } from '@/lib/date-utils'
import type { PomodoroSession } from '@/types/time'

// GET 응답 타입
interface PomodoroSessionsResponse {
  success: boolean
  data: PomodoroSession[]
  completed_count: number
  error?: string
}

// POST 응답 타입
interface RecordPomodoroResponse {
  success: boolean
  data: PomodoroSession
  error?: string
}

// 세션 기록 입력 타입
interface RecordPomodoroInput {
  focus_minutes: number
  break_minutes: number
  completed: boolean
  date?: string
}

/**
 * 날짜별 포모도로 세션 조회 훅
 */
export function usePomodoroSessions(date?: string) {
  const targetDate = date ?? getToday()

  return useQuery<PomodoroSession[], Error, PomodoroSession[], [string, string]>({
    queryKey: ['pomodoro', targetDate],
    queryFn: async () => {
      const res = await fetch(`/api/time/pomodoro?date=${targetDate}`)
      const json = await res.json() as PomodoroSessionsResponse
      if (!json.success) throw new Error(json.error ?? '포모도로 세션 조회 실패')
      return json.data
    },
  })
}

/**
 * 오늘 완료된 포모도로 세션 수 조회 훅
 */
export function usePomodoroCompletedCount(date?: string) {
  const targetDate = date ?? getToday()

  return useQuery<number, Error>({
    queryKey: ['pomodoro-count', targetDate],
    queryFn: async () => {
      const res = await fetch(`/api/time/pomodoro?date=${targetDate}`)
      const json = await res.json() as PomodoroSessionsResponse
      if (!json.success) throw new Error(json.error ?? '포모도로 세션 조회 실패')
      return json.completed_count
    },
  })
}

/**
 * 포모도로 세션 완료 기록 훅
 */
export function useRecordPomodoro() {
  const queryClient = useQueryClient()

  return useMutation<PomodoroSession, Error, RecordPomodoroInput>({
    mutationFn: async (input) => {
      const res = await fetch('/api/time/pomodoro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as RecordPomodoroResponse
      if (!json.success) throw new Error(json.error ?? '포모도로 세션 기록 실패')
      return json.data
    },
    onSuccess: (data) => {
      // 해당 날짜의 포모도로 캐시 무효화
      void queryClient.invalidateQueries({ queryKey: ['pomodoro', data.date] })
      void queryClient.invalidateQueries({ queryKey: ['pomodoro-count', data.date] })
    },
  })
}
