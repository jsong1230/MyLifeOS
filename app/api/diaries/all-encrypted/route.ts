import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/diaries/all-encrypted — 마이그레이션 상태 확인용: content_encrypted 컬럼만 반환
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('diary_entries')
    .select('content_encrypted')
    .eq('user_id', user.id)

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: data ?? [] })
}
