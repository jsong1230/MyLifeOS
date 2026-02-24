import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { Todo } from '@/types/todo'
import type { Routine } from '@/types/routine'
import type { Transaction } from '@/types/transaction'
import type { MealLog, DrinkLog, SleepLog } from '@/types/health'
import type { DiaryEntry } from '@/types/diary'
import type { Relation } from '@/types/relation'

// 지원하는 모듈 유형
type ExportModule =
  | 'todos'
  | 'routines'
  | 'transactions'
  | 'meal_logs'
  | 'drink_logs'
  | 'health_logs'
  | 'diaries'
  | 'relations'
  | 'all'

// 전체 내보내기 응답 형태
interface ExportAllData {
  todos: Todo[]
  routines: Routine[]
  transactions: Transaction[]
  meal_logs: MealLog[]
  drink_logs: DrinkLog[]
  health_logs: SleepLog[]
  diaries: DiaryEntry[]
  relations: Relation[]
}

const VALID_MODULES: ExportModule[] = [
  'todos',
  'routines',
  'transactions',
  'meal_logs',
  'drink_logs',
  'health_logs',
  'diaries',
  'relations',
  'all',
]

/**
 * GET /api/export?module=todos|routines|transactions|meal_logs|drink_logs|health_logs|diaries|relations|all
 * 모듈별 또는 전체 데이터를 JSON으로 반환 (클라이언트에서 CSV/JSON 변환 후 다운로드)
 * 암호화된 데이터(diaries.content_encrypted, relations.memo_encrypted)는 그대로 반환
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  const { searchParams } = new URL(request.url)
  const moduleParam = searchParams.get('module')

  // module 파라미터 필수 검증
  if (!moduleParam) {
    return apiError('VALIDATION_ERROR')
  }

  // 유효한 모듈 값 검증
  if (!VALID_MODULES.includes(moduleParam as ExportModule)) {
    return NextResponse.json(
      {
        success: false,
        error: `유효하지 않은 모듈입니다. 허용 값: ${VALID_MODULES.join(', ')}`,
      },
      { status: 400 }
    )
  }

  const module = moduleParam as ExportModule

  try {
    if (module === 'all') {
      // 전체 모듈 데이터 병렬 조회
      const [
        todosResult,
        routinesResult,
        transactionsResult,
        mealLogsResult,
        drinkLogsResult,
        healthLogsResult,
        diariesResult,
        relationsResult,
      ] = await Promise.all([
        supabase
          .from('todos')
          .select(
            'id, user_id, title, description, due_date, priority, status, category, sort_order, completed_at, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true }),

        supabase
          .from('routines')
          .select(
            'id, user_id, title, description, frequency, days_of_week, interval_days, time_of_day, streak, is_active, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),

        supabase
          .from('transactions')
          .select(
            'id, user_id, amount, type, category_id, memo, date, is_favorite, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('date', { ascending: false }),

        supabase
          .from('meal_logs')
          .select(
            'id, user_id, meal_type, food_name, calories, protein, carbs, fat, date, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('date', { ascending: false }),

        supabase
          .from('drink_logs')
          .select(
            'id, user_id, drink_type, alcohol_pct, amount_ml, drink_count, date, note, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('date', { ascending: false }),

        supabase
          .from('health_logs')
          .select(
            'id, user_id, value, value2, date, time_start, time_end, note, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .eq('log_type', 'sleep')
          .order('date', { ascending: false }),

        supabase
          .from('diaries')
          .select(
            'id, user_id, date, content_encrypted, emotion_tags, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('date', { ascending: false }),

        supabase
          .from('relations')
          .select(
            'id, user_id, name, relationship_type, last_met_at, memo_encrypted, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('name', { ascending: true }),
      ])

      // 각 쿼리 에러 확인
      const errors = [
        todosResult.error,
        routinesResult.error,
        transactionsResult.error,
        mealLogsResult.error,
        drinkLogsResult.error,
        healthLogsResult.error,
        diariesResult.error,
        relationsResult.error,
      ].filter(Boolean)

      if (errors.length > 0) {
        return apiError('SERVER_ERROR')
      }

      const exportData: ExportAllData = {
        todos: (todosResult.data ?? []) as Todo[],
        routines: (routinesResult.data ?? []) as Routine[],
        transactions: (transactionsResult.data ?? []) as unknown as Transaction[],
        meal_logs: (mealLogsResult.data ?? []) as MealLog[],
        drink_logs: (drinkLogsResult.data ?? []) as DrinkLog[],
        health_logs: (healthLogsResult.data ?? []) as SleepLog[],
        diaries: (diariesResult.data ?? []) as DiaryEntry[],
        relations: (relationsResult.data ?? []) as Relation[],
      }

      return NextResponse.json({ success: true, data: exportData })
    }

    // 개별 모듈 조회
    switch (module) {
      case 'todos': {
        const { data, error } = await supabase
          .from('todos')
          .select(
            'id, user_id, title, description, due_date, priority, status, category, sort_order, completed_at, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('sort_order', { ascending: true })

        if (error) {
          return apiError('SERVER_ERROR')
        }
        return NextResponse.json({ success: true, data: (data ?? []) as Todo[] })
      }

      case 'routines': {
        const { data, error } = await supabase
          .from('routines')
          .select(
            'id, user_id, title, description, frequency, days_of_week, interval_days, time_of_day, streak, is_active, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })

        if (error) {
          return apiError('SERVER_ERROR')
        }
        return NextResponse.json({ success: true, data: (data ?? []) as Routine[] })
      }

      case 'transactions': {
        const { data, error } = await supabase
          .from('transactions')
          .select(
            'id, user_id, amount, type, category_id, memo, date, is_favorite, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        if (error) {
          return apiError('SERVER_ERROR')
        }
        return NextResponse.json({ success: true, data: (data ?? []) as unknown as Transaction[] })
      }

      case 'meal_logs': {
        const { data, error } = await supabase
          .from('meal_logs')
          .select(
            'id, user_id, meal_type, food_name, calories, protein, carbs, fat, date, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        if (error) {
          return apiError('SERVER_ERROR')
        }
        return NextResponse.json({ success: true, data: (data ?? []) as MealLog[] })
      }

      case 'drink_logs': {
        const { data, error } = await supabase
          .from('drink_logs')
          .select(
            'id, user_id, drink_type, alcohol_pct, amount_ml, drink_count, date, note, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        if (error) {
          return apiError('SERVER_ERROR')
        }
        return NextResponse.json({ success: true, data: (data ?? []) as DrinkLog[] })
      }

      case 'health_logs': {
        // 수면 기록 = health_logs WHERE log_type = 'sleep'
        const { data, error } = await supabase
          .from('health_logs')
          .select(
            'id, user_id, value, value2, date, time_start, time_end, note, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .eq('log_type', 'sleep')
          .order('date', { ascending: false })

        if (error) {
          return apiError('SERVER_ERROR')
        }
        return NextResponse.json({ success: true, data: (data ?? []) as SleepLog[] })
      }

      case 'diaries': {
        // 암호화 데이터(content_encrypted)는 그대로 반환 — 복호화는 클라이언트에서 처리
        const { data, error } = await supabase
          .from('diaries')
          .select(
            'id, user_id, date, content_encrypted, emotion_tags, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        if (error) {
          return apiError('SERVER_ERROR')
        }
        return NextResponse.json({ success: true, data: (data ?? []) as DiaryEntry[] })
      }

      case 'relations': {
        // 암호화 데이터(memo_encrypted)는 그대로 반환 — 복호화는 클라이언트에서 처리
        const { data, error } = await supabase
          .from('relations')
          .select(
            'id, user_id, name, relationship_type, last_met_at, memo_encrypted, created_at, updated_at'
          )
          .eq('user_id', user.id)
          .order('name', { ascending: true })

        if (error) {
          return apiError('SERVER_ERROR')
        }
        return NextResponse.json({ success: true, data: (data ?? []) as Relation[] })
      }

      default:
        return apiError('VALIDATION_ERROR')
    }
  } catch {
    return apiError('SERVER_ERROR')
  }
}
