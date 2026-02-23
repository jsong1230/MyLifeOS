export type TodoPriority = 'high' | 'medium' | 'low'
export type TodoStatus = 'pending' | 'completed' | 'cancelled'

export interface Todo {
  id: string
  user_id: string
  title: string
  description?: string | null
  due_date?: string | null  // DATE (ISO string)
  priority: TodoPriority
  status: TodoStatus
  category?: string | null
  sort_order: number
  completed_at?: string | null
  created_at: string
  updated_at: string
}

export interface CreateTodoInput {
  title: string
  description?: string
  due_date?: string
  priority?: TodoPriority
  category?: string
}

export interface UpdateTodoInput {
  title?: string
  description?: string
  due_date?: string | null
  priority?: TodoPriority
  status?: TodoStatus
  category?: string | null
  sort_order?: number
}

export interface ReorderTodoInput {
  id: string
  sort_order: number
}
