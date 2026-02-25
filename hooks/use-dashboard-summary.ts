import { useQuery } from '@tanstack/react-query'

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

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
  const today = getToday()
  const month = getCurrentMonth()

  return useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary', today, month],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/summary')
      const json = await res.json() as { success: boolean; data: DashboardSummary; error?: string }
      if (!json.success) throw new Error(json.error ?? '대시보드 데이터 조회 실패')
      return json.data
    },
  })
}
