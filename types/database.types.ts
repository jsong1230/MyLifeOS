/**
 * Supabase Database 타입 정의
 *
 * 실제 DB 스키마 기반으로 수동 작성됨 (app/api/ route 파일들에서 추론)
 * Supabase CLI 설치 후 아래 명령으로 자동 생성 가능:
 *   npm run gen:types
 *
 * @see https://supabase.com/docs/guides/api/rest/generating-types
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      // ── 카테고리 ───────────────────────────────────────────────
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          name_key: string | null
          icon: string | null
          color: string | null
          type: 'income' | 'expense' | 'both'
          is_system: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          name_key?: string | null
          icon?: string | null
          color?: string | null
          type: 'income' | 'expense' | 'both'
          is_system?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          name_key?: string | null
          icon?: string | null
          color?: string | null
          type?: 'income' | 'expense' | 'both'
          is_system?: boolean
          sort_order?: number
          created_at?: string
        }
      }

      // ── 거래 내역 ─────────────────────────────────────────────
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category_id: string | null
          memo: string | null
          date: string
          is_favorite: boolean
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category_id?: string | null
          memo?: string | null
          date?: string
          is_favorite?: boolean
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          type?: 'income' | 'expense'
          category_id?: string | null
          memo?: string | null
          date?: string
          is_favorite?: boolean
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }

      // ── 예산 ──────────────────────────────────────────────────
      budgets: {
        Row: {
          id: string
          user_id: string
          category_id: string | null
          amount: number
          year_month: string
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category_id?: string | null
          amount: number
          year_month: string
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category_id?: string | null
          amount?: number
          year_month?: string
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }

      // ── 정기 지출 ─────────────────────────────────────────────
      recurring_expenses: {
        Row: {
          id: string
          user_id: string
          name: string
          amount: number
          billing_day: number
          cycle: 'monthly' | 'yearly'
          category_id: string | null
          is_active: boolean
          currency: string
          last_recorded_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          amount: number
          billing_day: number
          cycle: 'monthly' | 'yearly'
          category_id?: string | null
          is_active?: boolean
          currency?: string
          last_recorded_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          amount?: number
          billing_day?: number
          cycle?: 'monthly' | 'yearly'
          category_id?: string | null
          is_active?: boolean
          currency?: string
          last_recorded_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ── 자산 ──────────────────────────────────────────────────
      assets: {
        Row: {
          id: string
          user_id: string
          asset_type: 'cash' | 'deposit' | 'investment' | 'other'
          amount: number
          note: string | null
          month: string
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          asset_type: 'cash' | 'deposit' | 'investment' | 'other'
          amount: number
          note?: string | null
          month: string
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          asset_type?: 'cash' | 'deposit' | 'investment' | 'other'
          amount?: number
          note?: string | null
          month?: string
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }

      // ── 할일 ──────────────────────────────────────────────────
      todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          due_date: string | null
          priority: 'high' | 'medium' | 'low'
          status: 'pending' | 'completed' | 'cancelled'
          category: string | null
          sort_order: number
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          due_date?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'pending' | 'completed' | 'cancelled'
          category?: string | null
          sort_order?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          due_date?: string | null
          priority?: 'high' | 'medium' | 'low'
          status?: 'pending' | 'completed' | 'cancelled'
          category?: string | null
          sort_order?: number
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ── 루틴 ──────────────────────────────────────────────────
      routines: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          frequency: 'daily' | 'weekly' | 'custom'
          days_of_week: number[] | null
          interval_days: number | null
          time_of_day: string | null
          streak: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          frequency: 'daily' | 'weekly' | 'custom'
          days_of_week?: number[] | null
          interval_days?: number | null
          time_of_day?: string | null
          streak?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          frequency?: 'daily' | 'weekly' | 'custom'
          days_of_week?: number[] | null
          interval_days?: number | null
          time_of_day?: string | null
          streak?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }

      // ── 루틴 체크인 기록 ──────────────────────────────────────
      routine_logs: {
        Row: {
          id: string
          routine_id: string
          user_id: string
          date: string
          completed: boolean
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          routine_id: string
          user_id: string
          date: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          routine_id?: string
          user_id?: string
          date?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
        }
      }

      // ── 시간 블록 ─────────────────────────────────────────────
      time_blocks: {
        Row: {
          id: string
          user_id: string
          title: string
          date: string
          start_time: string
          end_time: string
          color: string | null
          todo_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          date: string
          start_time: string
          end_time: string
          color?: string | null
          todo_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          date?: string
          start_time?: string
          end_time?: string
          color?: string | null
          todo_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ── 식사 기록 ─────────────────────────────────────────────
      meal_logs: {
        Row: {
          id: string
          user_id: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_name: string
          calories: number | null
          protein: number | null
          carbs: number | null
          fat: number | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_name: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_name?: string
          calories?: number | null
          protein?: number | null
          carbs?: number | null
          fat?: number | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }

      // ── 음주 기록 ─────────────────────────────────────────────
      drink_logs: {
        Row: {
          id: string
          user_id: string
          drink_type: 'beer' | 'soju' | 'wine' | 'whiskey' | 'other'
          alcohol_pct: number | null
          amount_ml: number
          drink_count: number | null
          date: string
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          drink_type: 'beer' | 'soju' | 'wine' | 'whiskey' | 'other'
          alcohol_pct?: number | null
          amount_ml: number
          drink_count?: number | null
          date?: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          drink_type?: 'beer' | 'soju' | 'wine' | 'whiskey' | 'other'
          alcohol_pct?: number | null
          amount_ml?: number
          drink_count?: number | null
          date?: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ── 건강 기록 (수면/체중/운동 등 통합) ───────────────────
      health_logs: {
        Row: {
          id: string
          user_id: string
          log_type: string
          value: number
          value2: number | null
          date: string
          time_start: string | null
          time_end: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_type: string
          value: number
          value2?: number | null
          date?: string
          time_start?: string | null
          time_end?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_type?: string
          value?: number
          value2?: number | null
          date?: string
          time_start?: string | null
          time_end?: string | null
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ── 체중/체성분 기록 ──────────────────────────────────────
      body_logs: {
        Row: {
          id: string
          user_id: string
          weight: number | null
          body_fat: number | null
          muscle_mass: number | null
          date: string
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          weight?: number | null
          body_fat?: number | null
          muscle_mass?: number | null
          date?: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          weight?: number | null
          body_fat?: number | null
          muscle_mass?: number | null
          date?: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ── 운동 기록 ─────────────────────────────────────────────
      exercise_logs: {
        Row: {
          id: string
          user_id: string
          exercise_type: string
          duration_min: number
          intensity: 'light' | 'moderate' | 'intense'
          calories_burned: number | null
          date: string
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          exercise_type: string
          duration_min: number
          intensity: 'light' | 'moderate' | 'intense'
          calories_burned?: number | null
          date?: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          exercise_type?: string
          duration_min?: number
          intensity?: 'light' | 'moderate' | 'intense'
          calories_burned?: number | null
          date?: string
          note?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ── 일기 ──────────────────────────────────────────────────
      diaries: {
        Row: {
          id: string
          user_id: string
          date: string
          content_encrypted: string
          emotion_tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          content_encrypted: string
          emotion_tags?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          content_encrypted?: string
          emotion_tags?: string[]
          created_at?: string
          updated_at?: string
        }
      }

      // ── 인간관계 메모 ─────────────────────────────────────────
      relations: {
        Row: {
          id: string
          user_id: string
          name: string
          relationship_type: 'family' | 'friend' | 'colleague' | 'other'
          last_met_at: string | null
          memo_encrypted: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          relationship_type: 'family' | 'friend' | 'colleague' | 'other'
          last_met_at?: string | null
          memo_encrypted?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          relationship_type?: 'family' | 'friend' | 'colleague' | 'other'
          last_met_at?: string | null
          memo_encrypted?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ── 사용자 설정 ───────────────────────────────────────────
      user_settings: {
        Row: {
          id: string
          user_id: string
          locale: 'ko' | 'en'
          default_currency: string
          nickname: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          locale?: 'ko' | 'en'
          default_currency?: string
          nickname?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          locale?: 'ko' | 'en'
          default_currency?: string
          nickname?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      [_ in never]: never
    }

    Enums: {
      [_ in never]: never
    }
  }
}

// ── 편의 타입 alias ────────────────────────────────────────────────────────

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
