import { useMutation } from '@tanstack/react-query'
import type { AiInsightsResponse } from '@/app/api/ai/insights/route'

export function useGenerateInsights() {
  return useMutation({
    mutationFn: async (locale: string) => {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale }),
      })
      if (!res.ok) throw new Error('Failed to generate insights')
      const data = await res.json()
      return data.data as AiInsightsResponse
    },
  })
}
