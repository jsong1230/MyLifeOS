import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateTransactionInput, Transaction } from '@/types/transaction'

// PATCH /api/transactions/[id] — 거래 수정
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

  let body: UpdateTransactionInput
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 금액 검증 (수정 시 입력된 경우)
  if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount <= 0)) {
    return NextResponse.json(
      { success: false, error: '금액은 0보다 커야 합니다' },
      { status: 400 }
    )
  }

  // 거래 타입 검증 (수정 시 입력된 경우)
  if (body.type && !['income', 'expense'].includes(body.type)) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 거래 타입입니다' },
      { status: 400 }
    )
  }

  // 해당 거래가 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '거래를 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  const updateData: Record<string, unknown> = {
    ...body,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(
      'id, user_id, amount, type, category_id, memo, date, is_favorite, created_at, updated_at, category:categories(id, name, icon, color, type)'
    )
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '거래 수정에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as unknown as Transaction })
}

// DELETE /api/transactions/[id] — 거래 삭제
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

  // 해당 거래가 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('transactions')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '거래를 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { success: false, error: '거래 삭제에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: null })
}
