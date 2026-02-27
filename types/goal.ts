export interface Goal {
  id: string
  user_id: string
  title: string
  description?: string | null
  category: string
  target_date?: string | null
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  progress: number
  created_at: string
  updated_at: string
  milestones?: GoalMilestone[]
}

export interface GoalMilestone {
  id: string
  goal_id: string
  title: string
  completed: boolean
  due_date?: string | null
  created_at: string
}

export type CreateGoalInput = Pick<Goal, 'title'> & Partial<Pick<Goal, 'description' | 'category' | 'target_date'>>

export type UpdateGoalInput = Partial<Pick<Goal, 'title' | 'description' | 'category' | 'target_date' | 'status' | 'progress'>>
