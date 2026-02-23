export type RoutineFrequency = 'daily' | 'weekly' | 'custom'

export interface Routine {
  id: string
  user_id: string
  title: string
  description?: string | null
  frequency: RoutineFrequency
  days_of_week?: number[] | null  // 0=일, 1=월, ..., 6=토
  interval_days?: number | null   // custom 주기
  time_of_day?: string | null     // HH:MM
  streak: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RoutineLog {
  id: string
  routine_id: string
  user_id: string
  date: string  // DATE (ISO string)
  completed: boolean
  completed_at?: string | null
  created_at: string
}

export interface CreateRoutineInput {
  title: string
  description?: string
  frequency: RoutineFrequency
  days_of_week?: number[]
  interval_days?: number
  time_of_day?: string
}

export interface UpdateRoutineInput {
  title?: string
  description?: string
  frequency?: RoutineFrequency
  days_of_week?: number[] | null
  interval_days?: number | null
  time_of_day?: string | null
  is_active?: boolean
}

export interface RoutineWithLog extends Routine {
  log?: RoutineLog | null  // 오늘의 체크인 기록
}
