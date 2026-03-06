import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/health/water/[id] — 수분 섭취 기록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { id } = await params

  if (!id) {
    return apiError('VALIDATION_ERROR')
  }

  // 해당 수분 기록이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('water_logs')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  const { error } = await supabase
    .from('water_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
