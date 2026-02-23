import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateBudgetInput } from '@/types/budget'

/**
 * PATCH /api/budgets/[id]
 * 예산 금액 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // 인증 확인
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

    let body: UpdateBudgetInput
    try {
      body = (await request.json()) as UpdateBudgetInput
    } catch {
      return NextResponse.json(
        { success: false, error: '잘못된 요청 형식입니다' },
        { status: 400 }
      )
    }

    // 금액 검증
    if (body.amount === undefined || body.amount === null) {
      return NextResponse.json(
        { success: false, error: '예산 금액은 필수입니다' },
        { status: 400 }
      )
    }

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: '예산 금액은 0보다 큰 숫자여야 합니다' },
        { status: 400 }
      )
    }

    // 해당 예산이 현재 사용자 소유인지 확인
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '예산을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // 금액 업데이트
    const { data: updated, error: updateError } = await supabase
      .from('budgets')
      .update({
        amount: body.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select(
        'id, user_id, category_id, amount, year_month, created_at, updated_at, category:categories(id, name, icon, color, type, is_system, sort_order, created_at)'
      )
      .maybeSingle()

    if (updateError || !updated) {
      return NextResponse.json(
        { success: false, error: '예산 수정에 실패했습니다' },
        { status: 500 }
      )
    }

    const normalizedBudget = {
      ...updated,
      amount: Number(updated.amount),
      category: Array.isArray(updated.category)
        ? (updated.category[0] ?? null)
        : (updated.category ?? null),
    }

    return NextResponse.json({ success: true, data: normalizedBudget })
  } catch {
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/budgets/[id]
 * 예산 삭제
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // 인증 확인
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

    // 해당 예산이 현재 사용자 소유인지 확인
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '예산을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const { error: deleteError } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: '예산 삭제에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: null })
  } catch {
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
