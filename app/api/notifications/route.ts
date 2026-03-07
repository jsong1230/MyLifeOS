import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { AppNotification } from '@/types/notification'

// GET /api/notifications — 최근 30개 알림 목록 (최신순) + unread_count
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, type, title, body, read_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) return apiError('SERVER_ERROR')

  const notifications = data as AppNotification[]
  const unread_count = notifications.filter((n) => n.read_at === null).length

  return NextResponse.json({ success: true, data: notifications, unread_count })
}

// POST /api/notifications — 새 알림 생성 (내부 cron에서 사용)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: { type?: string; title: string; body?: string }
  try {
    body = await request.json() as { type?: string; title: string; body?: string }
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return apiError('VALIDATION_ERROR')
  }

  const validTypes = ['info', 'warning', 'reminder']
  const type = body.type && validTypes.includes(body.type) ? body.type : 'info'

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: user.id,
      type,
      title: body.title.trim(),
      body: body.body?.trim() ?? null,
    })
    .select('id, user_id, type, title, body, read_at, created_at')
    .maybeSingle()

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: data as AppNotification }, { status: 201 })
}
