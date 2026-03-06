export interface ShoppingList {
  id: string
  user_id: string
  name: string
  budget: number | null
  currency: string
  is_completed: boolean
  created_at: string
  updated_at: string
  items?: ShoppingItem[]  // 조인 시 포함
}

export interface ShoppingItem {
  id: string
  list_id: string
  user_id: string
  name: string
  quantity: number
  unit: string | null
  estimated_price: number | null
  actual_price: number | null
  category: string | null
  is_checked: boolean
  sort_order: number
  created_at: string
}

export interface CreateShoppingListInput {
  name?: string
  budget?: number
  currency?: string
}

export interface CreateShoppingItemInput {
  list_id: string
  name: string
  quantity?: number
  unit?: string
  estimated_price?: number
  category?: string
}

export interface ShoppingListSummary extends ShoppingList {
  total_items: number
  checked_items: number
  estimated_total: number
  actual_total: number
}
