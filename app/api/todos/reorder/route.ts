import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { ReorderTodoInput } from '@/types/todo'

interface ReorderRequestBody {
  items: ReorderTodoInput[]
}

// POST /api/todos/reorder — 할일 순서 일괄 변경
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return apiError('AUTH_REQUIRED')
  }
  const supabase = await createClient()

  let body: ReorderRequestBody
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return apiError('VALIDATION_ERROR')
  }

  // 각 항목 검증
  for (const item of body.items) {
    if (!item.id || typeof item.sort_order !== 'number') {
      return apiError('VALIDATION_ERROR')
    }
  }

  // 모든 항목이 현재 사용자 소유인지 확인
  const ids = body.items.map((item) => item.id)
  const { data: existingItems } = await supabase
    .from('todos')
    .select('id')
    .eq('user_id', userId)
    .in('id', ids)

  if (!existingItems || existingItems.length !== ids.length) {
    return apiError('NOT_FOUND')
  }

  // 각 항목의 sort_order를 개별 업데이트 (Supabase는 bulk update를 직접 지원하지 않음)
  const updatePromises = body.items.map((item) =>
    supabase
      .from('todos')
      .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
      .eq('id', item.id)
      .eq('user_id', userId)
  )

  const results = await Promise.all(updatePromises)

  const hasError = results.some((result) => result.error)
  if (hasError) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
