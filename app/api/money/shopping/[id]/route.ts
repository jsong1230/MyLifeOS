import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

// GET /api/money/shopping/[id] → 목록 단건 + 아이템 전체
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('shopping_lists')
    .select(`
      id, user_id, name, budget, currency, is_completed, created_at, updated_at,
      shopping_items(id, list_id, user_id, name, quantity, unit, estimated_price, actual_price, category, is_checked, sort_order, created_at)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return apiError('NOT_FOUND')
    return apiError('SERVER_ERROR')
  }

  const items = (data.shopping_items ?? []).sort((a, b) => a.sort_order - b.sort_order)

  return NextResponse.json({ success: true, data: { ...data, items, shopping_items: undefined } })
}

// PATCH /api/money/shopping/[id] → 목록 수정 (이름, 예산, is_completed)
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: { name?: string; budget?: number | null; currency?: string; is_completed?: boolean }
  try {
    body = await request.json() as typeof body
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) updates.name = body.name.trim()
  if ('budget' in body) updates.budget = body.budget ?? null
  if (body.currency !== undefined) updates.currency = body.currency
  if (body.is_completed !== undefined) updates.is_completed = body.is_completed

  const { data, error } = await supabase
    .from('shopping_lists')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, name, budget, currency, is_completed, created_at, updated_at')
    .single()

  if (error) {
    if (error.code === 'PGRST116') return apiError('NOT_FOUND')
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data })
}

// DELETE /api/money/shopping/[id] → 목록 삭제
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { error } = await supabase
    .from('shopping_lists')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: null })
}
