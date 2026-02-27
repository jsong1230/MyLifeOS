import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { UpdateDrinkInput, DrinkLog } from '@/types/health'

// PATCH /api/health/drinks/[id] — 음주 기록 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { id } = await params

  if (!id) {
    return apiError('VALIDATION_ERROR')
  }

  let body: UpdateDrinkInput
  try {
    body = await request.json() as UpdateDrinkInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 주종 검증 (수정 시 입력된 경우)
  const validDrinkTypes = ['beer', 'soju', 'wine', 'whiskey', 'other']
  if (body.drink_type && !validDrinkTypes.includes(body.drink_type)) {
    return apiError('VALIDATION_ERROR')
  }

  // 음주량 검증 (수정 시 입력된 경우)
  if (body.amount_ml !== undefined) {
    if (typeof body.amount_ml !== 'number' || body.amount_ml <= 0) {
      return apiError('VALIDATION_ERROR')
    }
  }

  // 도수 범위 검증 (수정 시 입력된 경우)
  if (body.alcohol_pct !== undefined && body.alcohol_pct !== null) {
    if (typeof body.alcohol_pct !== 'number' || body.alcohol_pct < 0 || body.alcohol_pct > 100) {
      return apiError('VALIDATION_ERROR')
    }
  }

  // 날짜 형식 검증 (수정 시 입력된 경우)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (body.date && !datePattern.test(body.date)) {
    return apiError('VALIDATION_ERROR')
  }

  // 해당 기록이 현재 사용자 소유인지 확인 (RLS로도 보호되지만 명시적 확인)
  const { data: existing } = await supabase
    .from('drink_logs')
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
    .from('drink_logs')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select(
      'id, user_id, drink_type, alcohol_pct, amount_ml, drink_count, date, note, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as DrinkLog })
}

// DELETE /api/health/drinks/[id] — 음주 기록 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { id } = await params

  if (!id) {
    return apiError('VALIDATION_ERROR')
  }

  // 해당 기록이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('drink_logs')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  const { error } = await supabase
    .from('drink_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
