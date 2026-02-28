import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday, formatDateToString } from '@/lib/date-utils'
import type { WeeklyReport } from '@/types/report'

// YYYY-MM-DD 날짜 형식 정규식
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// 주어진 날짜 문자열에서 해당 주 월요일(주 시작) 반환
function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getUTCDay() // 0=일, 1=월, ..., 6=토
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setUTCDate(date.getUTCDate() + diff)
  return formatDateToString(monday)
}

// 주 시작일(월요일)에서 6일 후 주 종료일(일요일) 반환
function getWeekEnd(weekStart: string): string {
  const date = new Date(weekStart)
  date.setUTCDate(date.getUTCDate() + 6)
  return formatDateToString(date)
}

// 소수점 첫째 자리 반올림 유틸
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

// GET /api/reports/weekly?week=YYYY-MM-DD
// week 파라미터: 주 시작 월요일 날짜. 생략 시 이번 주 월요일.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const weekParam = searchParams.get('week')

  // 날짜 형식 검증
  if (weekParam && !DATE_PATTERN.test(weekParam)) {
    return apiError('VALIDATION_ERROR')
  }

  // 주 시작일 결정 — 전달된 week 파라미터를 기준으로 월요일 계산
  const today = getToday()
  const weekStart = getWeekStart(weekParam ?? today)
  const weekEnd = getWeekEnd(weekStart)

  // ── 1. 할일 집계 ──────────────────────────────────────────────
  // 해당 주에 due_date가 속하는 할일의 전체/완료 수 조회
  const { data: todosData, error: todosError } = await supabase
    .from('todos')
    .select('id, status')
    .eq('user_id', userId)
    .gte('due_date', weekStart)
    .lte('due_date', weekEnd)

  if (todosError) {
    return apiError('SERVER_ERROR')
  }

  const todoTotal = todosData?.length ?? 0
  const todoCompleted = todosData?.filter((t) => t.status === 'completed').length ?? 0
  const todoRate = todoTotal > 0 ? Math.round((todoCompleted / todoTotal) * 100) : 0

  // ── 2. 수입/지출 집계 (통화별 분리) ─────────────────────────
  const transactionsResult = await supabase
    .from('transactions')
    .select('amount, type, currency')
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lte('date', weekEnd)

  if (transactionsResult.error) {
    return apiError('SERVER_ERROR')
  }

  const byCurrency: Record<string, { income: number; expense: number }> = {}
  for (const tx of transactionsResult.data ?? []) {
    const curr = (tx.currency as string) ?? 'KRW'
    if (!byCurrency[curr]) byCurrency[curr] = { income: 0, expense: 0 }
    if (tx.type === 'income') byCurrency[curr].income += tx.amount
    else byCurrency[curr].expense += tx.amount
  }

  // ── 3. 수면 집계 ─────────────────────────────────────────────
  // health_logs 테이블에서 log_type='sleep', value=수면시간(h)
  const { data: sleepData, error: sleepError } = await supabase
    .from('health_logs')
    .select('value')
    .eq('user_id', userId)
    .eq('log_type', 'sleep')
    .gte('date', weekStart)
    .lte('date', weekEnd)

  if (sleepError) {
    return apiError('SERVER_ERROR')
  }

  const sleepCount = sleepData?.length ?? 0
  const avgSleep =
    sleepCount > 0
      ? round1(sleepData!.reduce((sum, s) => sum + Number(s.value), 0) / sleepCount)
      : 0

  // ── 4. 음주 집계 ─────────────────────────────────────────────
  // drink_logs 테이블에서 날짜별 기록이 있는 일수 계산
  const { data: drinkData, error: drinkError } = await supabase
    .from('drink_logs')
    .select('date')
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lte('date', weekEnd)

  if (drinkError) {
    return apiError('SERVER_ERROR')
  }

  // 중복 날짜를 제거하여 음주 일수(day 기준) 계산
  const uniqueDrinkDays = new Set(drinkData?.map((d) => d.date) ?? []).size

  // ── 5. 감정 분포 집계 ────────────────────────────────────────
  // diaries 테이블에서 emotion_tags 배열 조회
  const { data: diariesData, error: diariesError } = await supabase
    .from('diaries')
    .select('emotion_tags')
    .eq('user_id', userId)
    .gte('date', weekStart)
    .lte('date', weekEnd)

  if (diariesError) {
    return apiError('SERVER_ERROR')
  }

  // 각 감정 태그 횟수 집계
  const emotions: Record<string, number> = {}
  for (const diary of diariesData ?? []) {
    const tags = diary.emotion_tags as string[] | null
    if (Array.isArray(tags)) {
      for (const tag of tags) {
        emotions[tag] = (emotions[tag] ?? 0) + 1
      }
    }
  }

  // ── 응답 조립 ────────────────────────────────────────────────
  const report: WeeklyReport = {
    week_start: weekStart,
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
