import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateTodoInput, Todo } from '@/types/todo'

// PATCH /api/todos/[id] — 할일 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다' },
      { status: 401 }
    )
  }

  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 ID입니다' },
      { status: 400 }
    )
  }

  let body: UpdateTodoInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 우선순위 검증
  if (body.priority && !['high', 'medium', 'low'].includes(body.priority)) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 우선순위입니다' },
      { status: 400 }
    )
  }

  // 상태 검증
  if (body.status && !['pending', 'completed', 'cancelled'].includes(body.status)) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 상태입니다' },
      { status: 400 }
    )
  }

  // 제목이 있으면 빈 문자열 방지
  if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim() === '')) {
    return NextResponse.json(
      { success: false, error: '제목은 비워둘 수 없습니다' },
      { status: 400 }
    )
  }

  // 해당 할일이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('todos')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '할일을 찾을 수 없습니다' },
      { status: 404 }
    )
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
    .eq('user_id', user.id)
    .select(
      'id, user_id, title, description, due_date, priority, status, category, sort_order, completed_at, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '할일 수정에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as Todo })
}

// DELETE /api/todos/[id] — 할일 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다' },
      { status: 401 }
    )
  }

  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 ID입니다' },
      { status: 400 }
    )
  }

  // 해당 할일이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('todos')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '할일을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { success: false, error: '할일 삭제에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: null })
}
