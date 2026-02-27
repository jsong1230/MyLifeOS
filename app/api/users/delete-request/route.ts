import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { apiError } from '@/lib/api-errors'

export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return apiError('AUTH_REQUIRED')

  const { error } = await supabase
    .from('users')
    .update({ deletion_requested_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return apiError('SERVER_ERROR')
  return NextResponse.json({ success: true, data: { message: 'Deletion request submitted' } })
}
