import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/push/unsubscribe — 푸시 구독 해제
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: { endpoint?: string }
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  const { endpoint } = body
  if (!endpoint) {
    return apiError('VALIDATION_ERROR')
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  if (error) {
    console.error('Push unsubscribe error:', error)
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true })
}
