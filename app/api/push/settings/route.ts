import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_SETTINGS = {
  enabled: true,
  routine_reminders: true,
  recurring_reminders: true,
  goal_reminders: true,
  reminder_time: '09:00:00',
}

// GET /api/push/settings — 알림 설정 조회
export async function GET() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data ?? DEFAULT_SETTINGS })
}

// PATCH /api/push/settings — 알림 설정 업데이트
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  const allowed = ['enabled', 'routine_reminders', 'recurring_reminders', 'goal_reminders', 'reminder_time']
  const updateData: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updateData[key] = body[key]
  }

  if (Object.keys(updateData).length === 0) {
    return apiError('VALIDATION_ERROR')
  }

  const { data, error } = await supabase
    .from('notification_settings')
    .upsert(
      { user_id: user.id, ...updateData, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Push settings update error:', error)
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data })
}
