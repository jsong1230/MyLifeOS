import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { GoalMilestone } from '@/types/goal'

// PATCH /api/goals/[id]/milestones/[milestoneId] → 마일스톤 수정/토글
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { id: goalId, milestoneId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  // 목표 소유권 확인
  const { data: goal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single()

  if (!goal) return apiError('NOT_FOUND')

  let body: { title?: string; completed?: boolean; due_date?: string | null }
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  const updateData: Record<string, unknown> = {}
  if (body.title !== undefined) updateData.title = body.title.trim()
  if (body.completed !== undefined) updateData.completed = body.completed
  if ('due_date' in body) updateData.due_date = body.due_date ?? null

  const { data, error } = await supabase
    .from('goal_milestones')
    .update(updateData)
    .eq('id', milestoneId)
    .eq('goal_id', goalId)
    .select('id, goal_id, title, completed, due_date, created_at')
    .single()

  if (error) return apiError('SERVER_ERROR')
  if (!data) return apiError('NOT_FOUND')

  return NextResponse.json({ success: true, data: data as GoalMilestone })
}

// DELETE /api/goals/[id]/milestones/[milestoneId] → 마일스톤 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  const { id: goalId, milestoneId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  // 목표 소유권 확인
  const { data: goal } = await supabase
    .from('goals')
    .select('id')
    .eq('id', goalId)
    .eq('user_id', user.id)
    .single()

  if (!goal) return apiError('NOT_FOUND')

  const { error } = await supabase
    .from('goal_milestones')
    .delete()
    .eq('id', milestoneId)
    .eq('goal_id', goalId)

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: null })
}
