'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'

interface SettingsData {
  onboarding_completed?: boolean
  locale?: string
  default_currency?: string
  nickname?: string | null
}

export function useOnboarding() {
  const { user, isLoading: authLoading } = useAuthStore()

  const { data, isLoading } = useQuery<SettingsData>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings')
      if (!res.ok) return {}
      const json = await res.json()
      return json.data ?? {}
    },
    enabled: !!user && !authLoading,
    staleTime: 60 * 1000,
  })

  const shouldShow =
    !!user &&
    !authLoading &&
    !isLoading &&
    data !== undefined &&
    data.onboarding_completed === false

  return { shouldShow, isLoading }
}
