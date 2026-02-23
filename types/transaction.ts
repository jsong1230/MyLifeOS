import type { Category } from './category'

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
}

export interface UpdateTransactionInput {
  amount?: number
  type?: TransactionType
  category_id?: string | null
  memo?: string | null
  date?: string
  is_favorite?: boolean
}

export interface TransactionFilter {
  type?: TransactionType
  category_id?: string
  date_from?: string
  date_to?: string
  month?: string  // YYYY-MM
  is_favorite?: boolean
}
