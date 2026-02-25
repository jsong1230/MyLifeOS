export type CategoryType = 'income' | 'expense' | 'both'

export interface Category {
  id: string
  user_id?: string | null  // null이면 시스템 기본 카테고리
  name: string
  name_key?: string | null // 시스템 카테고리 i18n 키 (예: 'food', 'transport')
  icon?: string | null     // 이모지 또는 아이콘 코드
  color?: string | null    // HEX 색상 코드
  type: CategoryType
  is_system: boolean
  sort_order: number
  created_at: string
}

export interface CreateCategoryInput {
  name: string
  icon?: string
  color?: string
  type: CategoryType
}

export interface UpdateCategoryInput {
  name?: string
  icon?: string | null
  color?: string | null
  type?: CategoryType
  sort_order?: number
}
