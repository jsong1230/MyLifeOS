import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { BodyLog, CreateBodyLogInput } from '@/types/health'

// GET /api/health/body?limit=30  → 최근 N개 체중 기록
// GET /api/health/body?date=YYYY-MM-DD → 특정 날짜 기록
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') ?? '30') || 30, 1), 365)

  let query = supabase
    .from('body_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (date) {
    query = query.eq('date', date)
  } else {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: (data ?? []) as BodyLog[] })
}

// POST /api/health/body → 체중 기록 추가
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  let body: CreateBodyLogInput
  try {
    body = await request.json() as CreateBodyLogInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (body.weight == null && body.body_fat == null && body.muscle_mass == null) {
    return apiError('VALIDATION_ERROR')
  }

  const { data, error } = await supabase
    .from('body_logs')
    .insert({
      user_id: user.id,
      weight: body.weight ?? null,
      body_fat: body.body_fat ?? null,
      muscle_mass: body.muscle_mass ?? null,
      date: body.date ?? new Date().toISOString().split('T')[0],
      note: body.note ?? null,
    })
    .select('*')
    .single()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as BodyLog }, { status: 201 })
}
