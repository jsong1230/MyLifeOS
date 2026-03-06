// ─── 식사 기록 (meal_logs) ───────────────────────────────────
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export interface MealLog {
  id: string
  user_id: string
  meal_type: MealType
  food_name: string
  calories?: number | null
  protein?: number | null   // 단백질(g)
  carbs?: number | null     // 탄수화물(g)
  fat?: number | null       // 지방(g)
  date: string              // DATE (ISO string)
  created_at: string
  updated_at: string
}

export interface CreateMealInput {
  meal_type: MealType
  food_name: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  date?: string
}

export interface UpdateMealInput {
  meal_type?: MealType
  food_name?: string
  calories?: number | null
  protein?: number | null
  carbs?: number | null
  fat?: number | null
  date?: string
}

// ─── 음주 기록 (drink_logs) ──────────────────────────────────
export type DrinkType = 'beer' | 'soju' | 'wine' | 'whiskey' | 'other'

export const DRINK_TYPE_LABELS: Record<DrinkType, string> = {
  beer: '맥주',
  soju: '소주',
  wine: '와인',
  whiskey: '위스키',
  other: '기타',
}

export interface DrinkLog {
  id: string
  user_id: string
  drink_type: DrinkType
  alcohol_pct?: number | null  // 도수(%)
  amount_ml: number            // 양(ml)
  drink_count?: number | null  // 잔 수
  date: string
  note?: string | null
  created_at: string
  updated_at: string
}

export interface CreateDrinkInput {
  drink_type: DrinkType
  alcohol_pct?: number
  amount_ml: number
  drink_count?: number
  date?: string
  note?: string
}

export interface UpdateDrinkInput {
  drink_type?: DrinkType
  alcohol_pct?: number | null
  amount_ml?: number
  drink_count?: number | null
  date?: string
  note?: string | null
}

// ─── 수면 기록 (health_logs, log_type='sleep') ───────────────
export interface SleepLog {
  id: string
  user_id: string
  value: number        // 수면 시간(h)
  value2?: number | null  // 수면 질(1-5)
  date: string
  time_start?: string | null  // 취침 시각 HH:MM
  time_end?: string | null    // 기상 시각 HH:MM
  note?: string | null
  created_at: string
  updated_at: string
}

export interface CreateSleepInput {
  time_start: string   // HH:MM
  time_end: string     // HH:MM
  value2?: number      // 수면 질 1-5
  date?: string
  note?: string
}

export interface UpdateSleepInput {
  time_start?: string
  time_end?: string
  value2?: number | null
  date?: string
  note?: string | null
}

// ─── 체중/체성분 기록 (body_logs) ────────────────────────────
export interface BodyLog {
  id: string
  user_id: string
  weight?: number | null      // 체중(kg)
  body_fat?: number | null    // 체지방률(%)
  muscle_mass?: number | null // 근육량(kg)
  date: string                // YYYY-MM-DD
  note?: string | null
  created_at: string
  updated_at: string
}

export interface CreateBodyLogInput {
  weight?: number
  body_fat?: number
  muscle_mass?: number
  date?: string
  note?: string
}

export interface UpdateBodyLogInput {
  weight?: number | null
  body_fat?: number | null
  muscle_mass?: number | null
  date?: string
  note?: string | null
}

// ─── 운동 기록 (exercise_logs) ───────────────────────────────
export type ExerciseIntensity = 'light' | 'moderate' | 'intense'

export const EXERCISE_INTENSITY_LABEL: Record<ExerciseIntensity, string> = {
  light: '가벼움',
  moderate: '보통',
  intense: '격렬',
}

export interface ExerciseLog {
  id: string
  user_id: string
  exercise_type: string       // 운동 종류 (자유 입력)
  duration_min: number        // 운동 시간(분)
  intensity: ExerciseIntensity
  calories_burned?: number | null
  date: string                // YYYY-MM-DD
  note?: string | null
  created_at: string
  updated_at: string
}

export interface CreateExerciseInput {
  exercise_type: string
  duration_min: number
  intensity: ExerciseIntensity
  calories_burned?: number
  date?: string
  note?: string
}

export interface UpdateExerciseInput {
  exercise_type?: string
  duration_min?: number
  intensity?: ExerciseIntensity
  calories_burned?: number | null
  date?: string
  note?: string | null
}

// ─── 수분 섭취 (water_logs) ────────────────────────────────────
export interface WaterLog {
  id: string
  user_id: string
  amount_ml: number
  date: string
  created_at: string
}

export interface CreateWaterInput {
  amount_ml: number
  date?: string
}
