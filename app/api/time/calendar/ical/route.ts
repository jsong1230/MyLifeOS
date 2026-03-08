import { type NextRequest, NextResponse } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createAdminClient } from '@/lib/supabase/admin'
import { getToday } from '@/lib/date-utils'

/**
 * iCal 텍스트에 필요한 문자열 이스케이프 처리
 * RFC 5545 §3.3.11: 쉼표, 세미콜론, 역슬래시, 줄바꿈 이스케이프
 */
function escapeIcalText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}

/**
 * 현재 시각을 iCal DTSTAMP 형식(UTC)으로 반환
 * 예: 20260307T120000Z
 */
function getDtstamp(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const mo = String(now.getUTCMonth() + 1).padStart(2, '0')
  const d = String(now.getUTCDate()).padStart(2, '0')
  const h = String(now.getUTCHours()).padStart(2, '0')
  const mi = String(now.getUTCMinutes()).padStart(2, '0')
  const s = String(now.getUTCSeconds()).padStart(2, '0')
  return `${y}${mo}${d}T${h}${mi}${s}Z`
}

/**
 * 'YYYY-MM-DD' 날짜 문자열을 iCal DATE 형식(YYYYMMDD)으로 변환
 */
function toIcalDate(dateStr: string): string {
  return dateStr.replace(/-/g, '')
}

/**
 * 'YYYY-MM-DD' + 'HH:MM' 를 iCal DATETIME 형식(YYYYMMDDTHHmmss)으로 변환
 * 로컬 타임존 부동 시간(floating time) 사용
 */
function toIcalDateTime(dateStr: string, timeStr: string): string {
  const datePart = dateStr.replace(/-/g, '')
  const timePart = timeStr.replace(/:/g, '') + '00'
  return `${datePart}T${timePart}`
}

/**
 * GET /api/time/calendar/ical?token=<calendar_token>
 * 사용자의 할일, 루틴, 타임블록을 iCal 형식(.ics)으로 반환
 * Google Calendar 등 외부 클라이언트는 세션 없이 token 파라미터로 인증
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) return apiError('AUTH_REQUIRED')

    // admin 클라이언트: RLS 우회 (세션 없는 외부 클라이언트가 토큰으로 접근하므로)
    const supabase = createAdminClient()

    // 토큰으로 user_id 역조회
    const { data: settings, error: tokenError } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('calendar_token', token)
      .single()

    if (tokenError || !settings) return apiError('AUTH_REQUIRED')
    const userId = settings.user_id

    const today = getToday()
    const dtstamp = getDtstamp()

    // 1. 할일(todos): due_date 있고 status !== 'completed'
    const { data: todos, error: todosError } = await supabase
      .from('todos')
      .select('id, title, due_date, priority, category, status')
      .eq('user_id', userId)
      .not('due_date', 'is', null)
      .neq('status', 'completed')
      .order('due_date', { ascending: true })

    if (todosError) return apiError('SERVER_ERROR')

    // 2. 루틴(routines): is_active=true
    const { data: routines, error: routinesError } = await supabase
      .from('routines')
      .select('id, title, frequency, days_of_week, time_of_day')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (routinesError) return apiError('SERVER_ERROR')

    // 3. 타임블록(time_blocks): date >= 오늘
    const { data: timeBlocks, error: timeBlocksError } = await supabase
      .from('time_blocks')
      .select('id, title, date, start_time, end_time')
      .eq('user_id', userId)
      .gte('date', today)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (timeBlocksError) return apiError('SERVER_ERROR')

    // iCal 이벤트 목록 조립
    const events: string[] = []

    // 할일 이벤트
    for (const todo of todos ?? []) {
      if (!todo.due_date) continue
      const lines: string[] = [
        'BEGIN:VEVENT',
        `UID:todo-${todo.id}@mylifeos`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART;VALUE=DATE:${toIcalDate(todo.due_date)}`,
        `SUMMARY:${escapeIcalText(todo.title)}`,
      ]
      const descParts: string[] = []
      if (todo.priority) descParts.push(`priority: ${todo.priority}`)
      if (todo.category) descParts.push(`category: ${todo.category}`)
      if (descParts.length > 0) {
        lines.push(`DESCRIPTION:${escapeIcalText(descParts.join(', '))}`)
      }
      lines.push('END:VEVENT')
      events.push(lines.join('\r\n'))
    }

    // 루틴 이벤트 (매일 반복)
    for (const routine of routines ?? []) {
      const lines: string[] = [
        'BEGIN:VEVENT',
        `UID:routine-${routine.id}@mylifeos`,
        `DTSTAMP:${dtstamp}`,
      ]

      // 시작 시각이 있으면 DATETIME, 없으면 DATE
      if (routine.time_of_day) {
        lines.push(`DTSTART:${toIcalDateTime(today, routine.time_of_day)}`)
      } else {
        lines.push(`DTSTART;VALUE=DATE:${toIcalDate(today)}`)
      }

      // 반복 규칙
      if (routine.frequency === 'daily') {
        lines.push('RRULE:FREQ=DAILY')
      } else if (routine.frequency === 'weekly' && Array.isArray(routine.days_of_week) && routine.days_of_week.length > 0) {
        const dayMap: Record<number, string> = { 0: 'SU', 1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA' }
        const byDay = (routine.days_of_week as number[])
          .map((d) => dayMap[d])
          .filter(Boolean)
          .join(',')
        lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${byDay}`)
      } else {
        // custom 또는 기타: 매일 반복으로 처리
        lines.push('RRULE:FREQ=DAILY')
      }

      lines.push(`SUMMARY:${escapeIcalText(routine.title)}`)
      lines.push('END:VEVENT')
      events.push(lines.join('\r\n'))
    }

    // 타임블록 이벤트
    for (const block of timeBlocks ?? []) {
      const lines: string[] = [
        'BEGIN:VEVENT',
        `UID:timeblock-${block.id}@mylifeos`,
        `DTSTAMP:${dtstamp}`,
        `DTSTART:${toIcalDateTime(block.date, block.start_time)}`,
        `DTEND:${toIcalDateTime(block.date, block.end_time)}`,
        `SUMMARY:${escapeIcalText(block.title)}`,
        'END:VEVENT',
      ]
      events.push(lines.join('\r\n'))
    }

    // iCal 캘린더 조립
    const calLines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MyLifeOS//MyLifeOS//KO',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:My Life OS',
      ...events,
      'END:VCALENDAR',
    ]

    const icsContent = calLines.join('\r\n')

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="mylifeos.ics"',
        'Cache-Control': 'no-store',
      },
    })
  } catch {
    return apiError('SERVER_ERROR')
  }
}
