import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { BodyLog, UpdateBodyLogInput } from '@/types/health'

// PATCH /api/health/body/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  let body: UpdateBodyLogInput
  try {
    body = await request.json() as UpdateBodyLogInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  const updateData: Record<string, unknown> = {}
  if ('weight' in body) updateData.weight = body.weight ?? null
  if ('body_fat' in body) updateData.body_fat = body.body_fat ?? null
  if ('muscle_mass' in body) updateData.muscle_mass = body.muscle_mass ?? null
  if (body.date) updateData.date = body.date
  if ('note' in body) updateData.note = body.note ?? null

  const { data, error } = await supabase
    .from('body_logs')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (error) {
    return apiError('SERVER_ERROR')
  }
  if (!data) {
    return apiError('NOT_FOUND')
  }

  return NextResponse.json({ success: true, data: data as BodyLog })
}

// DELETE /api/health/body/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  const { error } = await supabase
    .from('body_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
