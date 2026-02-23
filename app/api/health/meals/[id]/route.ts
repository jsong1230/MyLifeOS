import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateMealInput, MealLog } from '@/types/health'

// PATCH /api/health/meals/[id] — 식사 기록 수정
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

  let body: UpdateMealInput
  try {
    body = await request.json() as UpdateMealInput
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 식사 유형 검증 (수정 시 입력된 경우)
  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  if (body.meal_type && !validMealTypes.includes(body.meal_type)) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 식사 유형입니다 (breakfast/lunch/dinner/snack)' },
      { status: 400 }
    )
  }

  // 음식명 검증 (수정 시 입력된 경우)
  if (body.food_name !== undefined && (typeof body.food_name !== 'string' || body.food_name.trim() === '')) {
    return NextResponse.json(
      { success: false, error: '음식명은 빈 값일 수 없습니다' },
      { status: 400 }
    )
  }

  // 날짜 형식 검증
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (body.date && !datePattern.test(body.date)) {
    return NextResponse.json(
      { success: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  // 해당 식사 기록이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('meal_logs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '식사 기록을 찾을 수 없습니다' },
      { status: 404 }
    )
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
    .eq('user_id', user.id)
    .select('id, user_id, meal_type, food_name, calories, protein, carbs, fat, date, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '식사 기록 수정에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as MealLog })
}

// DELETE /api/health/meals/[id] — 식사 기록 삭제
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

  // 해당 식사 기록이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('meal_logs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '식사 기록을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from('meal_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { success: false, error: '식사 기록 삭제에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: null })
}
