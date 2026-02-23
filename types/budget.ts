import type { Category } from './category'

export interface Budget {
  id: string
  user_id: string
  category_id?: string | null
  category?: Category | null  // 조인 시 포함
  amount: number
  year_month: string  // 'YYYY-MM'
  created_at: string
  updated_at: string
}

export interface CreateBudgetInput {
  category_id?: string
  amount: number
  year_month: string
}

export interface UpdateBudgetInput {
  amount: number
}

// 예산 대비 지출 현황
export interface BudgetStatus extends Budget {
  spent: number    // 실제 지출액
  remaining: number  // 잔여 예산
  percentage: number  // 소진률 (0-100+)
}
