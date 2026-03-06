// ─── 포모도로 세션 ────────────────────────────────────────────
export interface PomodoroSession {
  id: string
  user_id: string
  focus_minutes: number
  break_minutes: number
  completed: boolean
  date: string
  completed_at: string | null
  created_at: string
}

export interface CreatePomodoroInput {
  focus_minutes?: number
  break_minutes?: number
  date?: string
}
