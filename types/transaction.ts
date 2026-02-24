import type { Category } from './category'
import type { CurrencyCode } from '@/lib/currency'

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: TransactionType
  category_id?: string | null
  category?: Category | null  // 조인 시 포함
  memo?: string | null
  date: string  // DATE (ISO string)
  is_favorite: boolean
  currency: CurrencyCode
  created_at: string
  updated_at: string
}

export interface CreateTransactionInput {
  amount: number
  type: TransactionType
  category_id?: string
  memo?: string
  date?: string
  is_favorite?: boolean
  currency?: CurrencyCode
}

export interface UpdateTransactionInput {
  amount?: number
  type?: TransactionType
  category_id?: string | null
  memo?: string | null
  date?: string
  is_favorite?: boolean
  currency?: CurrencyCode
}

export interface TransactionFilter {
  type?: TransactionType
  category_id?: string
  date_from?: string
  date_to?: string
  month?: string  // YYYY-MM
  is_favorite?: boolean
}
