import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/routines/logs
 * 특정 날짜의 루틴 로그 목록 조회
 * 쿼리 파라미터: date (YYYY-MM-DD, 필수)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('AUTH_REQUIRED')
    const userId = user.id

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    if (!dateParam) {
      return apiError('VALIDATION_ERROR')
    }

    // 날짜 형식 검증
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateParam)) {
      return apiError('VALIDATION_ERROR')
    }

    const { data: logs, error: logsError } = await supabase
      .from('routine_logs')
      .select(
        'id, routine_id, user_id, date, completed, completed_at, created_at'
      )
      .eq('user_id', userId)
      .eq('date', dateParam)
      .order('created_at', { ascending: true })

    if (logsError) {
      return apiError('SERVER_ERROR')
    }

    return NextResponse.json({ success: true, data: logs ?? [] })
  } catch {
    return apiError('SERVER_ERROR')
  }
}

/**
 * POST /api/routines/logs
 * 루틴 체크인 (upsert)
 * body: { routineId: string, date: string (YYYY-MM-DD), completed: boolean }
 *
 * streak 업데이트 로직:
 * - completed=true: 어제도 완료 → streak+1, 아니면 streak=1
 * - completed=false: streak=0
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('AUTH_REQUIRED')
    const userId = user.id

    const body = (await request.json()) as {
      routineId: string
      date: string
      completed: boolean
    }

    const { routineId, date, completed } = body

    // 입력값 검증
    if (!routineId || typeof routineId !== 'string') {
      return apiError('VALIDATION_ERROR')
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!date || !dateRegex.test(date)) {
      return apiError('VALIDATION_ERROR')
    }

    if (typeof completed !== 'boolean') {
      return apiError('VALIDATION_ERROR')
    }

    // 루틴 소유권 확인 및 현재 streak 조회
    const { data: routine, error: routineError } = await supabase
      .from('routines')
      .select('id, streak')
      .eq('id', routineId)
      .eq('user_id', userId)
      .maybeSingle()

    if (routineError) {
      return apiError('SERVER_ERROR')
    }

    if (!routine) {
      return apiError('NOT_FOUND')
    }

    // completed_at 처리
    const completedAt = completed ? new Date().toISOString() : null

    // routine_logs upsert (unique: routine_id + date)
    const { data: log, error: upsertError } = await supabase
      .from('routine_logs')
      .upsert(
        {
          routine_id: routineId,
          user_id: userId,
          date,
          completed,
          completed_at: completedAt,
        },
        { onConflict: 'routine_id,date' }
      )
      .select(
        'id, routine_id, user_id, date, completed, completed_at, created_at'
      )
      .maybeSingle()

    if (upsertError || !log) {
      return apiError('SERVER_ERROR')
    }

    // streak 업데이트
    let newStreak: number

    if (completed) {
      // 어제 날짜 계산
      const currentDate = new Date(date)
      const yesterdayDate = new Date(currentDate)
      yesterdayDate.setDate(currentDate.getDate() - 1)
      const yesterdayString = yesterdayDate.toISOString().split('T')[0]

      // 어제 완료 여부 확인
      const { data: yesterdayLog } = await supabase
        .from('routine_logs')
        .select('completed')
        .eq('routine_id', routineId)
        .eq('date', yesterdayString)
        .maybeSingle()

      if (yesterdayLog?.completed) {
        // 어제도 완료 → streak 증가
        newStreak = routine.streak + 1
      } else {
        // 어제 미완료 → streak 초기화
        newStreak = 1
      }
    } else {
      // 미완료 → streak 리셋
      newStreak = 0
    }

    // routines 테이블 streak 업데이트
    const { error: streakError } = await supabase
      .from('routines')
      .update({
        streak: newStreak,
        updated_at: new Date().toISOString(),
      })
      .eq('id', routineId)
      .eq('user_id', userId)

    if (streakError) {
      return apiError('SERVER_ERROR')
    }

    return NextResponse.json({
      success: true,
      data: {
        log,
        streak: newStreak,
      },
    })
  } catch {
    return apiError('SERVER_ERROR')
  }
}
