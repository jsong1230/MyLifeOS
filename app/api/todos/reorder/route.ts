import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { ReorderTodoInput } from '@/types/todo'

interface ReorderRequestBody {
  items: ReorderTodoInput[]
}

// POST /api/todos/reorder — 할일 순서 일괄 변경
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

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

  // upsert 단일 호출로 sort_order 일괄 변경 (트랜잭션 보장)
  const updatedAt = new Date().toISOString()
  const upsertItems = body.items.map((item) => ({
    id: item.id,
    user_id: userId,
    sort_order: item.sort_order,
    updated_at: updatedAt,
  }))

  const { error } = await supabase
    .from('todos')
    .upsert(upsertItems, { onConflict: 'id', ignoreDuplicates: false })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
