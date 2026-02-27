import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { apiError } from '@/lib/api-errors'

// POST /api/users/delete-request — 회원 탈퇴 즉시 처리
export async function POST() {
  // 1. 현재 로그인 사용자 확인
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('AUTH_REQUIRED')

  // 2. Admin 클라이언트로 계정 즉시 삭제 (service_role key 필요)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) {
    return apiError('SERVER_ERROR')
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
  if (deleteError) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: { message: 'Account deleted' } })
}
