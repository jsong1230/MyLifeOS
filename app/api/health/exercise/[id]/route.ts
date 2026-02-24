import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { ExerciseLog, UpdateExerciseInput } from '@/types/health'

// PATCH /api/health/exercise/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  let body: UpdateExerciseInput
  try {
    body = await request.json() as UpdateExerciseInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  const updateData: Record<string, unknown> = {}
  if (body.exercise_type) updateData.exercise_type = body.exercise_type.trim()
  if (body.duration_min != null) updateData.duration_min = body.duration_min
  if (body.intensity) updateData.intensity = body.intensity
  if ('calories_burned' in body) updateData.calories_burned = body.calories_burned ?? null
  if (body.date) updateData.date = body.date
  if ('note' in body) updateData.note = body.note ?? null

  const { data, error } = await supabase
    .from('exercise_logs')
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

  return NextResponse.json({ success: true, data: data as ExerciseLog })
}

// DELETE /api/health/exercise/[id]
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  const { error } = await supabase
    .from('exercise_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
