import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AiInsightsResponse } from '@/app/api/ai/insights/route'

const QUERY_KEY = ['ai-insights']

// 저장된 인사이트 조회 (페이지 진입 시 자동 로드)
export function useAiInsights() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const res = await fetch('/api/ai/insights')
      if (!res.ok) throw new Error('Failed to load insights')
      const data = await res.json()
      return (data.data as AiInsightsResponse) ?? null
    },
  })
}

// 새 인사이트 생성 (Claude API 호출)
export function useGenerateInsights() {
  const queryClient = useQueryClient()
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
    onSuccess: (data) => {
      // 생성 후 캐시 업데이트 (서버 재요청 없이 즉시 반영)
      queryClient.setQueryData(QUERY_KEY, data)
    },
  })
}
