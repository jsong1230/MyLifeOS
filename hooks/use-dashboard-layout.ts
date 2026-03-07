import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { DEFAULT_LAYOUT } from '@/types/dashboard-layout'
import type { WidgetConfig } from '@/types/dashboard-layout'

const QUERY_KEY = ['dashboard-layout']

export function useDashboardLayout() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<WidgetConfig[]> => {
      const res = await fetch('/api/settings/dashboard-layout')
      if (!res.ok) return DEFAULT_LAYOUT
      const json = await res.json()
      return (json.data as WidgetConfig[]) ?? DEFAULT_LAYOUT
    },
    staleTime: Infinity,
  })
}

export function useUpdateDashboardLayout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (layout: WidgetConfig[]) => {
      const res = await fetch('/api/settings/dashboard-layout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout }),
      })
      if (!res.ok) throw new Error('Failed to save layout')
      const json = await res.json()
      return json.data as WidgetConfig[]
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEY, data)
    },
  })
}
