import { type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/health/measurements/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { id } = await params

  const { error } = await supabase
    .from('health_measurements')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return apiError('SERVER_ERROR')

  return new Response(null, { status: 204 })
}
