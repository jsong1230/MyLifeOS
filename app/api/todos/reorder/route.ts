import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ReorderTodoInput } from '@/types/todo'

interface ReorderRequestBody {
  items: ReorderTodoInput[]
}

// POST /api/todos/reorder — 할일 순서 일괄 변경
export async function POST(request: NextRequest) {
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

  let body: ReorderRequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      { success: false, error: 'items 배열이 필요합니다' },
      { status: 400 }
    )
  }

  // 각 항목 검증
  for (const item of body.items) {
    if (!item.id || typeof item.sort_order !== 'number') {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 항목 데이터입니다' },
        { status: 400 }
      )
    }
  }

  // 모든 항목이 현재 사용자 소유인지 확인
  const ids = body.items.map((item) => item.id)
  const { data: existingItems } = await supabase
    .from('todos')
    .select('id')
    .eq('user_id', user.id)
    .in('id', ids)

  if (!existingItems || existingItems.length !== ids.length) {
    return NextResponse.json(
      { success: false, error: '일부 할일을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  // 각 항목의 sort_order를 개별 업데이트 (Supabase는 bulk update를 직접 지원하지 않음)
  const updatePromises = body.items.map((item) =>
    supabase
      .from('todos')
      .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
      .eq('id', item.id)
      .eq('user_id', user.id)
  )

  const results = await Promise.all(updatePromises)

  const hasError = results.some((result) => result.error)
  if (hasError) {
    return NextResponse.json(
      { success: false, error: '순서 변경에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: null })
}
