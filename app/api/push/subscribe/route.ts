import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

// POST /api/push/subscribe — 푸시 구독 등록
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: { endpoint?: string; p256dh?: string; auth?: string }
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  const { endpoint, p256dh, auth } = body
  if (!endpoint || !p256dh || !auth) {
    return apiError('VALIDATION_ERROR')
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth_key: auth,
      },
      { onConflict: 'user_id,endpoint' }
    )

  if (error) {
    console.error('Push subscribe error:', error)
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true })
}
