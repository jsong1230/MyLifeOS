import { NextResponse } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/users/calendar-token
 * 캘린더 구독 토큰 조회 (없으면 자동 발급)
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return apiError('AUTH_REQUIRED')

    // 기존 토큰 조회
    const { data: settings, error: fetchError } = await supabase
      .from('user_settings')
      .select('calendar_token')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') return apiError('SERVER_ERROR')

    let token = settings?.calendar_token ?? null

    // 토큰이 없으면 자동 발급
    if (!token) {
      token = crypto.randomUUID()
      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({ user_id: user.id, calendar_token: token }, { onConflict: 'user_id' })
      if (upsertError) return apiError('SERVER_ERROR')
    }

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/time/calendar/ical?token=${token}`
    return NextResponse.json({ success: true, data: { token, url } })
  } catch {
    return apiError('SERVER_ERROR')
  }
}

/**
 * POST /api/users/calendar-token
 * 캘린더 구독 토큰 재발급 (기존 URL 즉시 만료)
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return apiError('AUTH_REQUIRED')

    const token = crypto.randomUUID()
    const { error: upsertError } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, calendar_token: token }, { onConflict: 'user_id' })
    if (upsertError) return apiError('SERVER_ERROR')

    const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/time/calendar/ical?token=${token}`
    return NextResponse.json({ success: true, data: { token, url } })
  } catch {
    return apiError('SERVER_ERROR')
  }
}
