// 정기 지출 관련 타입 정의
import type { CurrencyCode } from '@/lib/currency'

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
  currency: CurrencyCode
  last_recorded_date?: string | null  // 마지막으로 거래내역에 기록된 날짜
  created_at: string
  updated_at: string
}

export interface CreateRecurringInput {
  name: string
  amount: number
  billing_day: number
  cycle: RecurringCycle
  category_id?: string
  currency?: CurrencyCode
}

export interface UpdateRecurringInput {
  name?: string
  amount?: number
  billing_day?: number
  cycle?: RecurringCycle
  category_id?: string | null
  is_active?: boolean
  currency?: CurrencyCode
}
