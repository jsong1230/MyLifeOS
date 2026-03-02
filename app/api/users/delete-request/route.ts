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

  // 2. Admin 클라이언트 초기화 (service_role key 필요)
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!serviceRoleKey || !supabaseUrl) {
    return apiError('SERVER_ERROR')
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 3. 자식 테이블 먼저 삭제 (FK 의존 순서)
  const childTables = ['routine_logs', 'goal_milestones', 'investment_transactions'] as const
  const childResults = await Promise.all(
    childTables.map((table) => adminClient.from(table).delete().eq('user_id', user.id))
  )
  if (childResults.some((r) => r.error)) return apiError('SERVER_ERROR')

  // 4. 나머지 연관 테이블 데이터 병렬 삭제
  const userTables = [
    'routines',
    'time_blocks',
    'todos',
    'recurring_expenses',
    'transactions',
    'categories',
    'assets',
    'budgets',
    'body_logs',
    'exercise_logs',
    'drink_logs',
    'health_logs',
    'meal_logs',
    'diet_goals',
    'diaries',
    'relations',
    'goals',
    'investments',
    'ai_insights',
    'push_subscriptions',
    'notification_settings',
    'user_settings',
  ] as const

  const deleteResults = await Promise.all(
    userTables.map((table) => adminClient.from(table).delete().eq('user_id', user.id))
  )
  if (deleteResults.some((r) => r.error)) return apiError('SERVER_ERROR')

  // 5. Auth 계정 삭제
  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
  if (deleteError) return apiError('SERVER_ERROR')

  // 6. 세션 종료
  await supabase.auth.signOut()

  return NextResponse.json({ success: true, data: { message: 'Account deleted' } })
}
