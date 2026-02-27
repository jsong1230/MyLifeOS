import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { Goal, CreateGoalInput } from '@/types/goal'

const VALID_STATUSES = ['active', 'completed', 'paused', 'cancelled'] as const
const VALID_CATEGORIES = ['general', 'health', 'financial', 'education', 'career', 'personal'] as const

// GET /api/goals?status=active → 목표 목록 (마일스톤 포함)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase
    .from('goals')
    .select('id, user_id, title, description, category, target_date, status, progress, created_at, updated_at, goal_milestones(id, goal_id, title, completed, due_date, created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (status && VALID_STATUSES.includes(status as typeof VALID_STATUSES[number])) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) return apiError('SERVER_ERROR')

  const goals = (data ?? []).map((g) => ({
    ...g,
    milestones: g.goal_milestones ?? [],
    goal_milestones: undefined,
  })) as Goal[]

  return NextResponse.json({ success: true, data: goals })
}

// POST /api/goals → 목표 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: CreateGoalInput
  try {
    body = await request.json() as CreateGoalInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (!body.title?.trim()) return apiError('VALIDATION_ERROR')

  if (body.category && !VALID_CATEGORIES.includes(body.category as typeof VALID_CATEGORIES[number])) {
    return apiError('VALIDATION_ERROR')
  }

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      title: body.title.trim(),
      description: body.description?.trim() ?? null,
      category: body.category ?? 'general',
      target_date: body.target_date ?? null,
    })
    .select('id, user_id, title, description, category, target_date, status, progress, created_at, updated_at')
    .single()

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: { ...data, milestones: [] } as Goal }, { status: 201 })
}
