// ─── 식단 목표 (diet_goals) ────────────────────────────────────
export interface DietGoal {
  id: string
  user_id: string
  calorie_goal: number       // 일일 칼로리 목표 (kcal)
  protein_goal?: number | null   // 단백질 목표 (g)
  carbs_goal?: number | null     // 탄수화물 목표 (g)
  fat_goal?: number | null       // 지방 목표 (g)
  created_at: string
  updated_at: string
}

export interface UpsertDietGoalInput {
  calorie_goal: number
  protein_goal?: number
  carbs_goal?: number
  fat_goal?: number
}
