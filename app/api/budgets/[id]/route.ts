import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
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
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return apiError('AUTH_REQUIRED')
    }
    const supabase = await createClient()

    const { id } = await params

    if (!id) {
      return apiError('VALIDATION_ERROR')
    }

    let body: UpdateBudgetInput
    try {
      body = (await request.json()) as UpdateBudgetInput
    } catch {
      return apiError('VALIDATION_ERROR')
    }

    // 금액 검증
    if (body.amount === undefined || body.amount === null) {
      return apiError('VALIDATION_ERROR')
    }

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return apiError('VALIDATION_ERROR')
    }

    // 해당 예산이 현재 사용자 소유인지 확인
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (!existing) {
      return apiError('NOT_FOUND')
    }

    // 금액 업데이트
    const { data: updated, error: updateError } = await supabase
      .from('budgets')
      .update({
        amount: body.amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select(
        'id, user_id, category_id, amount, year_month, created_at, updated_at, category:categories(id, name, icon, color, type, is_system, sort_order, created_at)'
      )
      .maybeSingle()

    if (updateError || !updated) {
      return apiError('SERVER_ERROR')
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
    return apiError('SERVER_ERROR')
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
    const userId = request.headers.get('x-user-id')
    if (!userId) {
      return apiError('AUTH_REQUIRED')
    }
    const supabase = await createClient()

    const { id } = await params

    if (!id) {
      return apiError('VALIDATION_ERROR')
    }

    // 해당 예산이 현재 사용자 소유인지 확인
    const { data: existing } = await supabase
      .from('budgets')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (!existing) {
      return apiError('NOT_FOUND')
    }

    const { error: deleteError } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (deleteError) {
      return apiError('SERVER_ERROR')
    }

    return NextResponse.json({ success: true, data: null })
  } catch {
    return apiError('SERVER_ERROR')
  }
}
