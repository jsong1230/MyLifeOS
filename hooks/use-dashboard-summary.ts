import { useQuery } from '@tanstack/react-query'

export interface DashboardSummary {
  todos: {
    total: number
    completed: number
  }
  transactions: Array<{
    amount: number
    type: 'income' | 'expense'
    currency: string
  }>
  meals: {
    count: number
    totalCalories: number
    byType: {
      breakfast: number
      lunch: number
      dinner: number
      snack: number
    }
  }
  sleep: {
    hours: number | null
  }
  diary: {
    hasEntry: boolean
    emotionTags: string[]
  }
}

// 대시보드 집계 데이터 — 4개 카드가 이 훅을 공유해 단 1회 fetch
export function useDashboardSummary() {
  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    staleTime: 60_000,
    queryFn: async () => {
      const res = await fetch('/api/dashboard/summary')
      const json = await res.json() as { success: boolean; data: DashboardSummary; error?: string }
      if (!json.success) throw new Error(json.error ?? '대시보드 데이터 조회 실패')
      return json.data
    },
  })
}
