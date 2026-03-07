import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { AppNotification } from '@/types/notification'

// PATCH /api/notifications/[id] — 읽음 처리
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { id } = await params

  const { data, error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, type, title, body, read_at, created_at')
    .maybeSingle()

  if (error) return apiError('SERVER_ERROR')
  if (!data) return apiError('NOT_FOUND')

  return NextResponse.json({ success: true, data: data as AppNotification })
}
