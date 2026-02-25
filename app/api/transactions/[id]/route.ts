import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { UpdateTransactionInput, Transaction } from '@/types/transaction'

// PATCH /api/transactions/[id] — 거래 수정
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

  let body: UpdateTransactionInput
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 금액 검증 (수정 시 입력된 경우)
  if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount <= 0)) {
    return apiError('VALIDATION_ERROR')
  }

  // 거래 타입 검증 (수정 시 입력된 경우)
  if (body.type && !['income', 'expense'].includes(body.type)) {
    return apiError('VALIDATION_ERROR')
  }

  // 해당 거래가 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  const updateData: Record<string, unknown> = {
    ...body,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select(
      'id, user_id, amount, type, category_id, memo, date, is_favorite, created_at, updated_at, category:categories(id, name, name_key, icon, color, type)'
    )
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as unknown as Transaction })
}

// DELETE /api/transactions/[id] — 거래 삭제
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

  // 해당 거래가 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
