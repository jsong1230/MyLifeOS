import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string; itemId: string }> }

// PATCH /api/money/shopping/[id]/items/[itemId] → 아이템 수정 (체크, 가격, 수량 등)
export async function PATCH(request: NextRequest, { params }: Params) {
  const { itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: {
    name?: string
    quantity?: number
    unit?: string | null
    estimated_price?: number | null
    actual_price?: number | null
    category?: string | null
    is_checked?: boolean
    sort_order?: number
  }
  try {
    body = await request.json() as typeof body
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  const updates: Record<string, unknown> = {}
  if (body.name !== undefined) updates.name = body.name.trim()
  if (body.quantity !== undefined) updates.quantity = body.quantity
  if ('unit' in body) updates.unit = body.unit ?? null
  if ('estimated_price' in body) updates.estimated_price = body.estimated_price ?? null
  if ('actual_price' in body) updates.actual_price = body.actual_price ?? null
  if ('category' in body) updates.category = body.category ?? null
  if (body.is_checked !== undefined) updates.is_checked = body.is_checked
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order

  if (Object.keys(updates).length === 0) return apiError('VALIDATION_ERROR')

  const { data, error } = await supabase
    .from('shopping_items')
    .update(updates)
    .eq('id', itemId)
    .eq('user_id', user.id)
    .select('id, list_id, user_id, name, quantity, unit, estimated_price, actual_price, category, is_checked, sort_order, created_at')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return apiError('NOT_FOUND')
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data })
}

// DELETE /api/money/shopping/[id]/items/[itemId] → 아이템 삭제
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { itemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { error } = await supabase
    .from('shopping_items')
    .delete()
    .eq('id', itemId)
    .eq('user_id', user.id)

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: null })
}
