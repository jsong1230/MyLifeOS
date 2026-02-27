'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settings.store'
import type { UserSettings, UpdateSettingsInput } from '@/types/settings'

// 사용자 설정 조회 훅
export function useSettings() {
  const { setSettings } = useSettingsStore()

  const query = useQuery<UserSettings>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      const json = await res.json() as { success: boolean; data: UserSettings; error?: string }
      if (!json.success) throw new Error(json.error ?? 'FETCH_FAILED')
      return json.data
    },
    staleTime: 5 * 60 * 1000, // 5분
  })

  // 설정을 Zustand 스토어에도 동기화 (nickname 포함)
  useEffect(() => {
    if (query.data) {
      setSettings({
        locale: query.data.locale,
        defaultCurrency: query.data.default_currency,
        nickname: query.data.nickname ?? null,
      })
    }
  }, [query.data, setSettings])

  return query
}

// 사용자 설정 업데이트 훅
export function useUpdateSettings() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { setSettings } = useSettingsStore()

  return useMutation({
    mutationFn: async (input: UpdateSettingsInput) => {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      const json = await res.json() as { success: boolean; data: UserSettings; error?: string }
      if (!json.success) throw new Error(json.error ?? 'SAVE_FAILED')
      return json.data
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['settings'], data)
      setSettings({
        locale: data.locale,
        defaultCurrency: data.default_currency,
        nickname: data.nickname ?? null,
      })
      // locale 변경 시 페이지 새로고침으로 next-intl 쿠키 반영
      router.refresh()
    },
  })
}
