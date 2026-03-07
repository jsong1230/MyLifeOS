'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AppNotification } from '@/types/notification'

interface NotificationsResponse {
  success: boolean
  data: AppNotification[]
  unread_count: number
  error?: string
}

// 알림 목록 조회 훅 (1분마다 폴링)
export function useNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      const json = await res.json() as NotificationsResponse
      if (!json.success) throw new Error(json.error ?? '알림 조회 실패')
      return json
    },
    refetchInterval: 60_000,
  })
}

// 개별 읽음 처리 훅
export function useMarkRead() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, string>({
    mutationFn: async (id) => {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '읽음 처리 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

// 전체 읽음 처리 훅
export function useMarkAllRead() {
  const queryClient = useQueryClient()

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' })
      const json = await res.json() as { success: boolean; error?: string }
      if (!json.success) throw new Error(json.error ?? '전체 읽음 처리 실패')
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}
