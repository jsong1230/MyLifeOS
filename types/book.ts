export type BookStatus = 'to_read' | 'reading' | 'completed'

export interface Book {
  id: string
  user_id: string
  title: string
  author: string | null
  total_pages: number | null
  current_page: number
  status: BookStatus
  started_at: string | null
  completed_at: string | null
  rating: number | null
  memo: string | null
  created_at: string
  updated_at: string
}

export interface CreateBookInput {
  title: string
  author?: string
  total_pages?: number
  status?: BookStatus
  started_at?: string
}

export interface UpdateBookInput {
  title?: string
  author?: string
  total_pages?: number
  current_page?: number
  status?: BookStatus
  started_at?: string
  completed_at?: string
  rating?: number
  memo?: string
}
