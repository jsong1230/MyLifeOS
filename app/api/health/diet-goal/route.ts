import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { DietGoal, UpsertDietGoalInput } from '@/types/diet-goal'

// GET /api/health/diet-goal — 내 식단 목표 조회 (없으면 null 반환)
export async function GET() {
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

  const { data, error } = await supabase
    .from('diet_goals')
    .select('id, user_id, calorie_goal, protein_goal, carbs_goal, fat_goal, created_at, updated_at')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '식단 목표 조회에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as DietGoal | null })
}

// POST /api/health/diet-goal — 식단 목표 upsert (user_id 기준)
export async function POST(request: NextRequest) {
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

  let body: UpsertDietGoalInput
  try {
    body = await request.json() as UpsertDietGoalInput
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 칼로리 목표 필수 검증
  if (body.calorie_goal === undefined || body.calorie_goal === null) {
    return NextResponse.json(
      { success: false, error: '칼로리 목표는 필수입니다' },
      { status: 400 }
    )
  }

  // 칼로리 목표 양수 검증
  if (typeof body.calorie_goal !== 'number' || body.calorie_goal <= 0 || !Number.isFinite(body.calorie_goal)) {
    return NextResponse.json(
      { success: false, error: '칼로리 목표는 양수여야 합니다' },
      { status: 400 }
    )
  }

  // 선택 영양소 검증 (입력된 경우 양수)
  const optionalNumericFields: Array<keyof UpsertDietGoalInput> = ['protein_goal', 'carbs_goal', 'fat_goal']
  for (const field of optionalNumericFields) {
    const value = body[field]
    if (value !== undefined && value !== null) {
      if (typeof value !== 'number' || value < 0 || !Number.isFinite(value)) {
        return NextResponse.json(
          { success: false, error: `${field}은(는) 0 이상의 숫자여야 합니다` },
          { status: 400 }
        )
      }
    }
  }

  const upsertData = {
    user_id: user.id,
    calorie_goal: Math.round(body.calorie_goal),
    protein_goal: body.protein_goal ?? null,
    carbs_goal: body.carbs_goal ?? null,
    fat_goal: body.fat_goal ?? null,
  }

  // user_id 충돌 시 업데이트 (upsert)
  const { data, error } = await supabase
    .from('diet_goals')
    .upsert(upsertData, { onConflict: 'user_id' })
    .select('id, user_id, calorie_goal, protein_goal, carbs_goal, fat_goal, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '식단 목표 저장에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as DietGoal }, { status: 200 })
}
