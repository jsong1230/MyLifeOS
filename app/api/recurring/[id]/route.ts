import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateRecurringInput, RecurringExpense } from '@/types/recurring'

// PATCH /api/recurring/[id] — 정기 지출 수정
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

  let body: UpdateRecurringInput
  try {
    body = await request.json() as UpdateRecurringInput
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 이름 검증 (입력된 경우)
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: '이름은 빈 값일 수 없습니다' },
        { status: 400 }
      )
    }
  }

  // 금액 검증 (입력된 경우)
  if (body.amount !== undefined) {
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: '금액은 0보다 커야 합니다' },
        { status: 400 }
      )
    }
  }

  // 결제일 검증 (입력된 경우)
  if (body.billing_day !== undefined) {
    if (
      !Number.isInteger(body.billing_day) ||
      body.billing_day < 1 ||
      body.billing_day > 31
    ) {
      return NextResponse.json(
        { success: false, error: '결제일은 1에서 31 사이의 정수여야 합니다' },
        { status: 400 }
      )
    }
  }

  // 주기 검증 (입력된 경우)
  if (body.cycle !== undefined && !['monthly', 'yearly'].includes(body.cycle)) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 주기입니다' },
      { status: 400 }
    )
  }

  // 업데이트할 필드 구성
  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name.trim()
  if (body.amount !== undefined) updateData.amount = body.amount
  if (body.billing_day !== undefined) updateData.billing_day = body.billing_day
  if (body.cycle !== undefined) updateData.cycle = body.cycle
  if ('category_id' in body) updateData.category_id = body.category_id ?? null
  if (body.is_active !== undefined) updateData.is_active = body.is_active

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { success: false, error: '수정할 필드가 없습니다' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('recurring_expenses')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, name, amount, billing_day, cycle, category_id, is_active, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '정기 지출 수정에 실패했습니다' },
      { status: 500 }
    )
  }

  if (!data) {
    return NextResponse.json(
      { success: false, error: '정기 지출 항목을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true, data: data as RecurringExpense })
}

// DELETE /api/recurring/[id] — 정기 지출 삭제
export async function DELETE(
  _request: NextRequest,
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

  const { error } = await supabase
    .from('recurring_expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { success: false, error: '정기 지출 삭제에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: null })
}
