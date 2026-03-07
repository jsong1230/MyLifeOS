import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { formatDateToString } from '@/lib/date-utils'

export interface PomodoroStatDaily {
  date: string
  sessions: number
  focus_minutes: number
}

export interface PomodoroStatByWeekday {
  weekday: number // 0=월, 6=일
  avg_sessions: number
  avg_focus_minutes: number
}

export interface PomodoroStatsData {
  total_sessions: number
  total_focus_minutes: number
  daily: PomodoroStatDaily[]
  by_weekday: PomodoroStatByWeekday[]
}

/**
 * GET /api/time/pomodoro/stats?days=7
 * 기간별 포모도로 통계 조회 (completed=true 세션만)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('AUTH_REQUIRED')

    const { searchParams } = new URL(request.url)
    const rawDays = parseInt(searchParams.get('days') ?? '7', 10)
    const days = isNaN(rawDays) || rawDays < 1 ? 7 : Math.min(rawDays, 90)

    // 날짜 범위 계산 (toISOString 금지, formatDateToString 사용)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (days - 1))

    const startStr = formatDateToString(startDate)
    const endStr = formatDateToString(endDate)

    // completed=true 세션만 조회
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('date, focus_minutes')
      .eq('user_id', user.id)
      .eq('completed', true)
      .gte('date', startStr)
      .lte('date', endStr)
      .order('date', { ascending: true })

    if (error) {
      console.error('[GET /api/time/pomodoro/stats] DB error:', error)
      return apiError('SERVER_ERROR')
    }

    const rows = (data ?? []) as { date: string; focus_minutes: number }[]

    // 전체 합계
    const total_sessions = rows.length
    const total_focus_minutes = rows.reduce((sum, r) => sum + (r.focus_minutes ?? 0), 0)

    // 날짜별 집계 (Map 사용)
    const dailyMap = new Map<string, { sessions: number; focus_minutes: number }>()

    // 날짜 범위 내 모든 날 초기화
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate)
      d.setDate(startDate.getDate() + i)
      const dateStr = formatDateToString(d)
      dailyMap.set(dateStr, { sessions: 0, focus_minutes: 0 })
    }

    for (const row of rows) {
      const existing = dailyMap.get(row.date)
      if (existing) {
        existing.sessions += 1
        existing.focus_minutes += row.focus_minutes ?? 0
      }
    }

    const daily: PomodoroStatDaily[] = Array.from(dailyMap.entries()).map(
      ([date, val]) => ({ date, sessions: val.sessions, focus_minutes: val.focus_minutes })
    )

    // 요일별 집계 (0=월, 6=일 — JS getDay(): 0=일,1=월,...,6=토 → 변환 필요)
    // JS: 0=일,1=월,...,6=토 → 우리: 0=월,...,6=일
    const weekdayMap = new Map<number, { total_sessions: number; total_focus_minutes: number; day_count: number }>()
    for (let w = 0; w < 7; w++) {
      weekdayMap.set(w, { total_sessions: 0, total_focus_minutes: 0, day_count: 0 })
    }

    // 날짜별로 요일 집계
    for (const [dateStr, val] of dailyMap.entries()) {
      const dateObj = new Date(dateStr + 'T00:00:00') // 로컬 타임존
      const jsDay = dateObj.getDay() // 0=일,...,6=토
      const ourWeekday = jsDay === 0 ? 6 : jsDay - 1 // 0=월,...,6=일
      const entry = weekdayMap.get(ourWeekday)!
      entry.total_sessions += val.sessions
      entry.total_focus_minutes += val.focus_minutes
      entry.day_count += 1
    }

    const by_weekday: PomodoroStatByWeekday[] = Array.from(weekdayMap.entries()).map(
      ([weekday, entry]) => ({
        weekday,
        avg_sessions: entry.day_count > 0
          ? Math.round((entry.total_sessions / entry.day_count) * 10) / 10
          : 0,
        avg_focus_minutes: entry.day_count > 0
          ? Math.round(entry.total_focus_minutes / entry.day_count)
          : 0,
      })
    )

    const statsData: PomodoroStatsData = {
      total_sessions,
      total_focus_minutes,
      daily,
      by_weekday,
    }

    return NextResponse.json({ success: true, data: statsData })
  } catch (err) {
    console.error('[GET /api/time/pomodoro/stats] Unexpected error:', err)
    return apiError('SERVER_ERROR')
  }
}
