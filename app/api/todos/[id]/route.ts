import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { UpdateTodoInput, Todo } from '@/types/todo'

// PATCH /api/todos/[id] — 할일 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return apiError('AUTH_REQUIRED')
  }
  const supabase = await createClient()

  const { id } = await params

  if (!id) {
    return apiError('VALIDATION_ERROR')
  }

  let body: UpdateTodoInput
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 우선순위 검증
  if (body.priority && !['high', 'medium', 'low'].includes(body.priority)) {
    return apiError('VALIDATION_ERROR')
  }

  // 상태 검증
  if (body.status && !['pending', 'completed', 'cancelled'].includes(body.status)) {
    return apiError('VALIDATION_ERROR')
  }

  // 제목이 있으면 빈 문자열 방지
  if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim() === '')) {
    return apiError('VALIDATION_ERROR')
  }

  // 해당 할일이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('todos')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  // status를 'completed'로 변경 시 completed_at 자동 설정
  const updateData: Record<string, unknown> = {
    ...body,
    updated_at: new Date().toISOString(),
  }

  if (body.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  } else if (body.status === 'pending' || body.status === 'cancelled') {
    // 완료 상태 해제 시 completed_at 초기화
    updateData.completed_at = null
  }

  if (body.title) {
    updateData.title = body.title.trim()
  }

  const { data, error } = await supabase
    .from('todos')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select(
      'id, user_id, title, description, due_date, priority, status, category, sort_order, completed_at, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as Todo })
}

// DELETE /api/todos/[id] — 할일 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return apiError('AUTH_REQUIRED')
  }
  const supabase = await createClient()

  const { id } = await params

  if (!id) {
    return apiError('VALIDATION_ERROR')
  }

  // 해당 할일이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('todos')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
