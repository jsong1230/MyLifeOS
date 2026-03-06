import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/health/medications/[id] — 약 정보 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { id } = await params

  if (!id) return apiError('VALIDATION_ERROR')

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 소유자 확인
  const { data: existing } = await supabase
    .from('medications')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) return apiError('NOT_FOUND')

  const allowedFields = ['name', 'dosage', 'frequency', 'times', 'is_active']
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field]
    }
  }

  if (updateData.name !== undefined) {
    if (typeof updateData.name !== 'string' || (updateData.name as string).trim() === '') {
      return apiError('VALIDATION_ERROR')
    }
    updateData.name = (updateData.name as string).trim()
  }

  const validFrequencies = ['daily', 'weekly', 'as_needed']
  if (updateData.frequency !== undefined && !validFrequencies.includes(updateData.frequency as string)) {
    return apiError('VALIDATION_ERROR')
  }

  const { data, error } = await supabase
    .from('medications')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, user_id, name, dosage, frequency, times, is_active, created_at, updated_at')
    .maybeSingle()

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data })
}

// DELETE /api/health/medications/[id] — 약 삭제 (medication_logs CASCADE)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { id } = await params

  if (!id) return apiError('VALIDATION_ERROR')

  const { data: existing } = await supabase
    .from('medications')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) return apiError('NOT_FOUND')

  const { error } = await supabase
    .from('medications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: null })
}
