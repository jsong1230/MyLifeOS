// F-29 시간 블록(타임박싱) 타입 정의

export interface TimeBlock {
  id: string
  user_id: string
  title: string
  date: string          // YYYY-MM-DD
  start_time: string    // HH:MM
  end_time: string      // HH:MM
  color?: string | null // HEX 색상
  todo_id?: string | null  // 연결된 할일 ID (선택)
  created_at: string
  updated_at: string
}

export interface CreateTimeBlockInput {
  title: string
  date?: string
  start_time: string    // HH:MM
  end_time: string      // HH:MM
  color?: string
  todo_id?: string
}

export interface UpdateTimeBlockInput {
  title?: string
  date?: string
  start_time?: string
  end_time?: string
  color?: string | null
  todo_id?: string | null
}
