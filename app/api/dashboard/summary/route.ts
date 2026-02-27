import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday, getCurrentMonthRange } from '@/lib/date-utils'

// GET /api/dashboard/summary — 대시보드 4개 카드 집계 데이터 (단일 요청)
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return apiError('AUTH_REQUIRED')
  }
  const supabase = await createClient()

  const today = getToday()
  const { start: monthStart, end: monthEnd } = getCurrentMonthRange()

  // 5개 DB 쿼리 병렬 실행
  const [todosRes, transactionsRes, mealsRes, sleepRes, diaryRes] = await Promise.all([
    supabase
      .from('todos')
      .select('status')
      .eq('user_id', userId)
      .eq('due_date', today),
    supabase
      .from('transactions')
      .select('amount, type, currency')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd),
    supabase
      .from('meal_logs')
      .select('calories, meal_type')
      .eq('user_id', userId)
      .eq('date', today),
    supabase
      .from('health_logs')
      .select('value')
      .eq('user_id', userId)
      .eq('log_type', 'sleep')
      .eq('date', today)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('diaries')
      .select('emotion_tags')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle(),
  ])

  const todos = todosRes.data ?? []
  const transactions = transactionsRes.data ?? []
  const meals = mealsRes.data ?? []
  const sleep = sleepRes.data
  const diary = diaryRes.data

  return NextResponse.json({
    success: true,
    data: {
      todos: {
        total: todos.length,
        completed: todos.filter((t) => t.status === 'completed').length,
      },
      transactions,
      meals: {
        count: meals.length,
        totalCalories: meals.reduce((s, m) => s + (m.calories ?? 0), 0),
        byType: {
          breakfast: meals.filter((m) => m.meal_type === 'breakfast').length,
          lunch: meals.filter((m) => m.meal_type === 'lunch').length,
          dinner: meals.filter((m) => m.meal_type === 'dinner').length,
          snack: meals.filter((m) => m.meal_type === 'snack').length,
        },
      },
      sleep: {
        hours: sleep?.value ?? null,
      },
      diary: {
        hasEntry: diary !== null,
        emotionTags: diary?.emotion_tags ?? [],
      },
    },
  })
}
