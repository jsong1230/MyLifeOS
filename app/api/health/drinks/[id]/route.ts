import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateDrinkInput, DrinkLog } from '@/types/health'

// PATCH /api/health/drinks/[id] — 음주 기록 수정
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

  let body: UpdateDrinkInput
  try {
    body = await request.json() as UpdateDrinkInput
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 주종 검증 (수정 시 입력된 경우)
  const validDrinkTypes = ['beer', 'soju', 'wine', 'whiskey', 'other']
  if (body.drink_type && !validDrinkTypes.includes(body.drink_type)) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 주종입니다 (beer/soju/wine/whiskey/other)' },
      { status: 400 }
    )
  }

  // 음주량 검증 (수정 시 입력된 경우)
  if (body.amount_ml !== undefined) {
    if (typeof body.amount_ml !== 'number' || body.amount_ml <= 0) {
      return NextResponse.json(
        { success: false, error: '음주량은 0보다 커야 합니다' },
        { status: 400 }
      )
    }
  }

  // 도수 범위 검증 (수정 시 입력된 경우)
  if (body.alcohol_pct !== undefined && body.alcohol_pct !== null) {
    if (typeof body.alcohol_pct !== 'number' || body.alcohol_pct < 0 || body.alcohol_pct > 100) {
      return NextResponse.json(
        { success: false, error: '도수는 0~100 사이여야 합니다' },
        { status: 400 }
      )
    }
  }

  // 날짜 형식 검증 (수정 시 입력된 경우)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (body.date && !datePattern.test(body.date)) {
    return NextResponse.json(
      { success: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  // 해당 기록이 현재 사용자 소유인지 확인 (RLS로도 보호되지만 명시적 확인)
  const { data: existing } = await supabase
    .from('drink_logs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '음주 기록을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  const updateData: Record<string, unknown> = {
    ...body,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('drink_logs')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(
      'id, user_id, drink_type, alcohol_pct, amount_ml, drink_count, date, note, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '음주 기록 수정에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as DrinkLog })
}

// DELETE /api/health/drinks/[id] — 음주 기록 삭제
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

  // 해당 기록이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('drink_logs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '음주 기록을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from('drink_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { success: false, error: '음주 기록 삭제에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: null })
}
