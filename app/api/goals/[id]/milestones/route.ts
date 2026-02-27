import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { GoalMilestone } from '@/types/goal'

// POST /api/goals/[id]/milestones → 마일스톤 추가
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: goalId } = await params
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

  let body: { title: string; due_date?: string | null }
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (!body.title?.trim()) return apiError('VALIDATION_ERROR')

  const { data, error } = await supabase
    .from('goal_milestones')
    .insert({
      goal_id: goalId,
      title: body.title.trim(),
      due_date: body.due_date ?? null,
    })
    .select('id, goal_id, title, completed, due_date, created_at')
    .single()

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: data as GoalMilestone }, { status: 201 })
}
