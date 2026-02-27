import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Todo } from '@/types/todo'
import type { Routine } from '@/types/routine'
import type { Transaction } from '@/types/transaction'
import type { MealLog, DrinkLog, SleepLog } from '@/types/health'
import type { DiaryEntry } from '@/types/diary'
import type { Relation } from '@/types/relation'
import type { Database } from '@/types/database.types'

// export 쿼리에서 반환되는 transactions DB 행 타입 (카테고리 조인 없음)
type TransactionExportRow = Database['public']['Tables']['transactions']['Row']

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

// ── 모듈별 쿼리 함수 (all + 개별 조회 공용) ──────────────────────

function queryTodos(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('todos')
    .select('id, user_id, title, description, due_date, priority, status, category, sort_order, completed_at, created_at, updated_at')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })
}

function queryRoutines(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('routines')
    .select('id, user_id, title, description, frequency, days_of_week, interval_days, time_of_day, streak, is_active, created_at, updated_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
}

function queryTransactions(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('transactions')
    .select('id, user_id, amount, type, category_id, memo, date, is_favorite, created_at, updated_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })
}

function queryMealLogs(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('meal_logs')
    .select('id, user_id, meal_type, food_name, calories, protein, carbs, fat, date, created_at, updated_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })
}

function queryDrinkLogs(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('drink_logs')
    .select('id, user_id, drink_type, alcohol_pct, amount_ml, drink_count, date, note, created_at, updated_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })
}

function queryHealthLogs(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('health_logs')
    .select('id, user_id, value, value2, date, time_start, time_end, note, created_at, updated_at')
    .eq('user_id', userId)
    .eq('log_type', 'sleep')
    .order('date', { ascending: false })
}

function queryDiaries(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('diaries')
    .select('id, user_id, date, content_encrypted, emotion_tags, created_at, updated_at')
    .eq('user_id', userId)
    .order('date', { ascending: false })
}

function queryRelations(supabase: SupabaseClient, userId: string) {
  return supabase
    .from('relations')
    .select('id, user_id, name, relationship_type, last_met_at, memo_encrypted, created_at, updated_at')
    .eq('user_id', userId)
    .order('name', { ascending: true })
}

/**
 * GET /api/export?module=todos|routines|transactions|meal_logs|drink_logs|health_logs|diaries|relations|all
 * 모듈별 또는 전체 데이터를 JSON으로 반환 (클라이언트에서 CSV/JSON 변환 후 다운로드)
 * 암호화된 데이터(diaries.content_encrypted, relations.memo_encrypted)는 그대로 반환
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return apiError('AUTH_REQUIRED')
  const userId = session.user.id

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
        queryTodos(supabase, userId),
        queryRoutines(supabase, userId),
        queryTransactions(supabase, userId),
        queryMealLogs(supabase, userId),
        queryDrinkLogs(supabase, userId),
        queryHealthLogs(supabase, userId),
        queryDiaries(supabase, userId),
        queryRelations(supabase, userId),
      ])

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
        transactions: (transactionsResult.data ?? []) as TransactionExportRow[] as Transaction[],
        meal_logs: (mealLogsResult.data ?? []) as MealLog[],
        drink_logs: (drinkLogsResult.data ?? []) as DrinkLog[],
        health_logs: (healthLogsResult.data ?? []) as SleepLog[],
        diaries: (diariesResult.data ?? []) as DiaryEntry[],
        relations: (relationsResult.data ?? []) as Relation[],
      }

      return NextResponse.json({ success: true, data: exportData })
    }

    // 개별 모듈 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryMap: Record<Exclude<ExportModule, 'all'>, () => any> = {
      todos: () => queryTodos(supabase, userId),
      routines: () => queryRoutines(supabase, userId),
      transactions: () => queryTransactions(supabase, userId),
      meal_logs: () => queryMealLogs(supabase, userId),
      drink_logs: () => queryDrinkLogs(supabase, userId),
      health_logs: () => queryHealthLogs(supabase, userId),
      diaries: () => queryDiaries(supabase, userId),
      relations: () => queryRelations(supabase, userId),
    }

    const queryFn = queryMap[module as Exclude<ExportModule, 'all'>]
    if (!queryFn) {
      return apiError('VALIDATION_ERROR')
    }

    const { data, error } = await queryFn()
    if (error) {
      return apiError('SERVER_ERROR')
    }

    return NextResponse.json({ success: true, data: data ?? [] })
  } catch {
    return apiError('SERVER_ERROR')
  }
}
