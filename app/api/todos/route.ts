import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { CreateTodoInput, Todo } from '@/types/todo'

// GET /api/todos — 할일 목록 조회
// 쿼리 파라미터: date (YYYY-MM-DD) 또는 month (YYYY-MM) 지원, 없으면 전체
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const month = searchParams.get('month')

  let query = supabase
    .from('todos')
    .select(
      'id, user_id, title, description, due_date, priority, status, category, sort_order, completed_at, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('sort_order', { ascending: true })

  // 날짜 필터 적용
  if (date) {
    // 특정 날짜의 할일만 조회 (due_date 기준)
    query = query.eq('due_date', date)
  } else if (month) {
    // 특정 월의 할일만 조회
    const startDate = `${month}-01`
    // 월 마지막 날 계산
    const [year, monthNum] = month.split('-').map(Number)
    const lastDay = new Date(year, monthNum, 0).getDate()
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('due_date', startDate).lte('due_date', endDate)
  }

  const { data, error } = await query

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as Todo[] })
}

// POST /api/todos — 할일 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: CreateTodoInput
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 필수 필드 검증
  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return apiError('VALIDATION_ERROR')
  }

  // 우선순위 검증
  if (body.priority && !['high', 'medium', 'low'].includes(body.priority)) {
    return apiError('VALIDATION_ERROR')
  }

  // 현재 최대 sort_order 조회하여 새 항목은 맨 뒤에 추가
  const { data: maxOrderData } = await supabase
    .from('todos')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSortOrder = maxOrderData ? maxOrderData.sort_order + 1 : 0

  const insertData = {
    user_id: userId,
    title: body.title.trim(),
    description: body.description ?? null,
    due_date: body.due_date ?? null,
    priority: body.priority ?? 'medium',
    status: 'pending' as const,
    category: body.category ?? null,
    sort_order: nextSortOrder,
  }

  const { data, error } = await supabase
    .from('todos')
    .insert(insertData)
    .select(
      'id, user_id, title, description, due_date, priority, status, category, sort_order, completed_at, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as Todo }, { status: 201 })
}
