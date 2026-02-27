import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

export interface TodoStatsResponse {
  total: number
  completed: number
  pending: number
  rate: number // 완료율 0~100
}

/**
 * GET /api/todos/stats
 * 할일 완료율 통계
 * 쿼리 파라미터:
 *   - week: YYYY-MM-DD (주 시작 월요일) → 해당 주 통계
 *   - month: YYYY-MM → 해당 월 통계
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { searchParams } = new URL(request.url)
  const week = searchParams.get('week')
  const month = searchParams.get('month')

  let startDate: string
  let endDate: string

  if (week) {
    // 주간: 월요일 ~ 일요일
    const monday = new Date(week + 'T00:00:00')
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    startDate = week
    endDate = sunday.toISOString().split('T')[0]
  } else if (month) {
    // 월간: 1일 ~ 말일
    const [year, monthNum] = month.split('-').map(Number)
    const lastDay = new Date(year, monthNum, 0).getDate()
    startDate = `${month}-01`
    endDate = `${month}-${String(lastDay).padStart(2, '0')}`
  } else {
    return apiError('VALIDATION_ERROR')
  }

  const { data, error } = await supabase
    .from('todos')
    .select('status')
    .eq('user_id', userId)
    .not('due_date', 'is', null)
    .gte('due_date', startDate)
    .lte('due_date', endDate)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  const total = data.length
  const completed = data.filter((t) => t.status === 'completed').length
  const pending = total - completed
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0

  return NextResponse.json({
    success: true,
    data: { total, completed, pending, rate } satisfies TodoStatsResponse,
  })
}
