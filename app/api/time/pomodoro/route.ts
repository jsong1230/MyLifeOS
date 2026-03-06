import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday } from '@/lib/date-utils'
import type { PomodoroSession } from '@/types/time'

/**
 * GET /api/time/pomodoro?date=YYYY-MM-DD
 * 날짜별 포모도로 세션 목록 조회 + 완료 횟수
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('AUTH_REQUIRED')

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') ?? getToday()

    // 날짜별 세션 목록 조회
    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .select('id, user_id, focus_minutes, break_minutes, completed, date, completed_at, created_at')
      .eq('user_id', user.id)
      .eq('date', date)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[GET /api/time/pomodoro] DB error:', error)
      return apiError('SERVER_ERROR')
    }

    const sessions = (data ?? []) as PomodoroSession[]
    // 완료된 세션 수
    const completed_count = sessions.filter((s) => s.completed).length

    return NextResponse.json({ success: true, data: sessions, completed_count })
  } catch (err) {
    console.error('[GET /api/time/pomodoro] Unexpected error:', err)
    return apiError('SERVER_ERROR')
  }
}

/**
 * POST /api/time/pomodoro
 * 포모도로 세션 완료 기록
 * body: { focus_minutes, break_minutes, completed, date }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('AUTH_REQUIRED')

    const body = await request.json() as {
      focus_minutes?: number
      break_minutes?: number
      completed?: boolean
      date?: string
    }

    const focus_minutes = body.focus_minutes ?? 25
    const break_minutes = body.break_minutes ?? 5
    const completed = body.completed ?? true
    const date = body.date ?? getToday()

    // 입력값 검증
    if (focus_minutes < 1 || focus_minutes > 120) {
      return apiError('VALIDATION_ERROR', { field: 'focus_minutes', message: '집중 시간은 1~120분이어야 합니다' })
    }
    if (break_minutes < 1 || break_minutes > 60) {
      return apiError('VALIDATION_ERROR', { field: 'break_minutes', message: '휴식 시간은 1~60분이어야 합니다' })
    }

    const { data, error } = await supabase
      .from('pomodoro_sessions')
      .insert({
        user_id: user.id,
        focus_minutes,
        break_minutes,
        completed,
        date,
        completed_at: completed ? new Date().toISOString() : null,
      })
      .select('id, user_id, focus_minutes, break_minutes, completed, date, completed_at, created_at')
      .single()

    if (error) {
      console.error('[POST /api/time/pomodoro] DB error:', error)
      return apiError('SERVER_ERROR')
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (err) {
    console.error('[POST /api/time/pomodoro] Unexpected error:', err)
    return apiError('SERVER_ERROR')
  }
}
