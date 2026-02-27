import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getMonthRange, getPrevMonth } from '@/lib/date-utils'
import type { MonthlyReport } from '@/types/report'

// 소수점 첫째 자리 반올림 유틸
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

// GET /api/reports/monthly?year=YYYY&month=MM
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { searchParams } = new URL(request.url)
  const yearParam = searchParams.get('year')
  const monthParam = searchParams.get('month')

  // year, month 파라미터 검증
  if (!yearParam || !monthParam) {
    return apiError('VALIDATION_ERROR')
  }

  const year = parseInt(yearParam, 10)
  const month = parseInt(monthParam, 10)

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return apiError('VALIDATION_ERROR')
  }

  const { start: monthStart, end: monthEnd } = getMonthRange(year, month)
  const { year: prevYear, month: prevMonth } = getPrevMonth(year, month)
  const { start: prevStart, end: prevEnd } = getMonthRange(prevYear, prevMonth)

  // ── 2. 이번달 + 전월 수입/지출 병렬 조회 (통화별 분리) ───────
  const [txResult, prevTxResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, type, currency')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd),
    supabase
      .from('transactions')
      .select('amount, type, currency')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .gte('date', prevStart)
      .lte('date', prevEnd),
  ])

  if (txResult.error || prevTxResult.error) {
    return apiError('SERVER_ERROR')
  }

  // 이번달: 통화별 수입/지출 집계
  const byCurrency: Record<string, { income: number; expense: number; prev_expense: number; change_pct: number }> = {}
  for (const tx of txResult.data ?? []) {
    const curr = (tx.currency as string) ?? 'KRW'
    if (!byCurrency[curr]) byCurrency[curr] = { income: 0, expense: 0, prev_expense: 0, change_pct: 0 }
    if (tx.type === 'income') byCurrency[curr].income += tx.amount
    else byCurrency[curr].expense += tx.amount
  }

  // 전월: 통화별 지출 집계
  for (const tx of prevTxResult.data ?? []) {
    const curr = (tx.currency as string) ?? 'KRW'
    if (!byCurrency[curr]) byCurrency[curr] = { income: 0, expense: 0, prev_expense: 0, change_pct: 0 }
    byCurrency[curr].prev_expense += tx.amount
  }

  // 전월 대비 증감률 계산
  for (const v of Object.values(byCurrency)) {
    v.change_pct = v.prev_expense > 0
      ? Math.round(((v.expense - v.prev_expense) / v.prev_expense) * 100)
      : 0
  }

  // ── 1+4+5+6. todos + sleep + drinks + diaries 병렬 조회 ────────
  const [todosResult, sleepResult, drinkResult, diariesResult] = await Promise.all([
    supabase
      .from('todos')
      .select('id, status')
      .eq('user_id', userId)
      .gte('due_date', monthStart)
      .lte('due_date', monthEnd),
    supabase
      .from('health_logs')
      .select('value')
      .eq('user_id', userId)
      .eq('log_type', 'sleep')
      .gte('date', monthStart)
      .lte('date', monthEnd),
    supabase
      .from('drink_logs')
      .select('date')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd),
    supabase
      .from('diaries')
      .select('emotion_tags')
      .eq('user_id', userId)
      .gte('date', monthStart)
      .lte('date', monthEnd),
  ])

  if (todosResult.error || sleepResult.error || drinkResult.error || diariesResult.error) {
    return apiError('SERVER_ERROR')
  }

  // ── 1. 할일 집계 ─────────────────────────────────────────────
  const todoTotal = todosResult.data?.length ?? 0
  const todoCompleted = todosResult.data?.filter((t) => t.status === 'completed').length ?? 0
  const todoRate = todoTotal > 0 ? Math.round((todoCompleted / todoTotal) * 100) : 0

  // ── 4. 수면 집계 ─────────────────────────────────────────────
  const sleepCount = sleepResult.data?.length ?? 0
  const avgSleep =
    sleepCount > 0
      ? round1(sleepResult.data!.reduce((sum, s) => sum + Number(s.value), 0) / sleepCount)
      : 0

  // ── 5. 음주 집계 (중복 날짜 제거 후 음주 일수) ──────────────
  const uniqueDrinkDays = new Set(drinkResult.data?.map((d) => d.date) ?? []).size

  // ── 6. 감정 분포 집계 ────────────────────────────────────────
  const emotions: Record<string, number> = {}
  for (const diary of diariesResult.data ?? []) {
    const tags = diary.emotion_tags as string[] | null
    if (Array.isArray(tags)) {
      for (const tag of tags) {
        emotions[tag] = (emotions[tag] ?? 0) + 1
      }
    }
  }

  // ── 응답 조립 ────────────────────────────────────────────────
  const report: MonthlyReport = {
    year,
    month,
    todos: {
      total: todoTotal,
      completed: todoCompleted,
      rate: todoRate,
    },
    spending: {
      byCurrency,
    },
    health: {
      avg_sleep: avgSleep,
      drink_days: uniqueDrinkDays,
    },
    emotions,
  }

  return NextResponse.json({ success: true, data: report })
}
