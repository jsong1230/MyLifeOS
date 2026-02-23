import { createClient } from '@supabase/supabase-js'

/**
 * service_role 키를 사용하는 관리자 클라이언트.
 * RLS를 우회하므로 서버 사이드 전용으로만 사용.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}
