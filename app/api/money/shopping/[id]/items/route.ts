import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { CreateShoppingItemInput } from '@/types/shopping'

type Params = { params: Promise<{ id: string }> }

// POST /api/money/shopping/[id]/items → 아이템 추가
export async function POST(request: NextRequest, { params }: Params) {
  const { id: listId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  // 목록 소유권 확인
  const { data: list, error: listError } = await supabase
    .from('shopping_lists')
    .select('id')
    .eq('id', listId)
    .eq('user_id', user.id)
    .single()

  if (listError || !list) return apiError('NOT_FOUND')

  let body: CreateShoppingItemInput
  try {
    body = await request.json() as CreateShoppingItemInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (!body.name?.trim()) return apiError('VALIDATION_ERROR')

  // 현재 최대 sort_order 조회
  const { data: maxRow } = await supabase
    .from('shopping_items')
    .select('sort_order')
    .eq('list_id', listId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxRow?.sort_order ?? -1) + 1

  const { data, error } = await supabase
    .from('shopping_items')
    .insert({
      list_id: listId,
      user_id: user.id,
      name: body.name.trim(),
      quantity: body.quantity ?? 1,
      unit: body.unit?.trim() ?? null,
      estimated_price: body.estimated_price ?? null,
      category: body.category?.trim() ?? null,
      sort_order: nextOrder,
    })
    .select('id, list_id, user_id, name, quantity, unit, estimated_price, actual_price, category, is_checked, sort_order, created_at')
    .single()

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data }, { status: 201 })
}
