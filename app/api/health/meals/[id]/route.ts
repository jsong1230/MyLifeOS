import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { UpdateMealInput, MealLog } from '@/types/health'

// PATCH /api/health/meals/[id] — 식사 기록 수정
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

  let body: UpdateMealInput
  try {
    body = await request.json() as UpdateMealInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 식사 유형 검증 (수정 시 입력된 경우)
  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  if (body.meal_type && !validMealTypes.includes(body.meal_type)) {
    return apiError('VALIDATION_ERROR')
  }

  // 음식명 검증 (수정 시 입력된 경우)
  if (body.food_name !== undefined && (typeof body.food_name !== 'string' || body.food_name.trim() === '')) {
    return apiError('VALIDATION_ERROR')
  }

  // 날짜 형식 검증
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (body.date && !datePattern.test(body.date)) {
    return apiError('VALIDATION_ERROR')
  }

  // 해당 식사 기록이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('meal_logs')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  // food_name trim 처리
  const updateData: Record<string, unknown> = {
    ...body,
    ...(body.food_name !== undefined ? { food_name: body.food_name.trim() } : {}),
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('meal_logs')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select('id, user_id, meal_type, food_name, calories, protein, carbs, fat, date, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as MealLog })
}

// DELETE /api/health/meals/[id] — 식사 기록 삭제
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

  // 해당 식사 기록이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('meal_logs')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  const { error } = await supabase
    .from('meal_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
