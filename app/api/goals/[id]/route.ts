import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { Goal, UpdateGoalInput } from '@/types/goal'

const VALID_STATUSES = ['active', 'completed', 'paused', 'cancelled'] as const
const VALID_CATEGORIES = ['general', 'health', 'financial', 'education', 'career', 'personal'] as const

// GET /api/goals/[id] → 목표 단건 조회 (마일스톤 포함)
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('goals')
    .select('id, user_id, title, description, category, target_date, status, progress, created_at, updated_at, goal_milestones(id, goal_id, title, completed, due_date, created_at)')
    .eq('id', id)
    .eq('user_id', userId)
    .single()

  if (error) return apiError('NOT_FOUND')

  const goal = {
    ...data,
    milestones: data.goal_milestones ?? [],
    goal_milestones: undefined,
  } as Goal

  return NextResponse.json({ success: true, data: goal })
}

// PATCH /api/goals/[id] → 목표 수정
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: UpdateGoalInput
  try {
    body = await request.json() as UpdateGoalInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (body.status && !VALID_STATUSES.includes(body.status as typeof VALID_STATUSES[number])) {
    return apiError('VALIDATION_ERROR')
  }

  if (body.category && !VALID_CATEGORIES.includes(body.category as typeof VALID_CATEGORIES[number])) {
    return apiError('VALIDATION_ERROR')
  }

  if (body.progress !== undefined && (body.progress < 0 || body.progress > 100)) {
    return apiError('VALIDATION_ERROR')
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) updateData.title = body.title.trim()
  if ('description' in body) updateData.description = body.description?.trim() ?? null
  if (body.category !== undefined) updateData.category = body.category
  if ('target_date' in body) updateData.target_date = body.target_date ?? null
  if (body.status !== undefined) updateData.status = body.status
  if (body.progress !== undefined) updateData.progress = body.progress

  const { data, error } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, title, description, category, target_date, status, progress, created_at, updated_at')
    .single()

  if (error) return apiError('SERVER_ERROR')
  if (!data) return apiError('NOT_FOUND')

  return NextResponse.json({ success: true, data: data as Goal })
}

// DELETE /api/goals/[id] → 목표 삭제 (마일스톤 CASCADE)
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: null })
}
