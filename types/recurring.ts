// 정기 지출 관련 타입 정의

export type RecurringCycle = 'monthly' | 'yearly'

export interface RecurringExpense {
  id: string
  user_id: string
  name: string
  amount: number
  billing_day: number        // 매월 결제일 (1-31)
  cycle: RecurringCycle
  category_id?: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateRecurringInput {
  name: string
  amount: number
  billing_day: number
  cycle: RecurringCycle
  category_id?: string
}

export interface UpdateRecurringInput {
  name?: string
  amount?: number
  billing_day?: number
  cycle?: RecurringCycle
  category_id?: string | null
  is_active?: boolean
}
