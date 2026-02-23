import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateMealInput, MealLog } from '@/types/health'

// 식사 유형 정렬 순서 정의
const MEAL_TYPE_ORDER = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 } as const

// GET /api/health/meals — 날짜별 식사 목록 조회
// 쿼리 파라미터: date (YYYY-MM-DD, 기본값: 오늘)
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url)
  const rawDate = searchParams.get('date')

  // 날짜 파라미터 검증: YYYY-MM-DD 형식
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  let targetDate: string

  if (rawDate) {
    if (!datePattern.test(rawDate)) {
      return NextResponse.json(
        { success: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
        { status: 400 }
      )
    }
    targetDate = rawDate
  } else {
    // 기본값: 오늘 날짜
    targetDate = new Date().toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('meal_logs')
    .select('id, user_id, meal_type, food_name, calories, protein, carbs, fat, date, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('date', targetDate)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json(
      { success: false, error: '식사 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }

  // 식사 유형별 순서로 정렬 (breakfast → lunch → dinner → snack)
  const sorted = [...(data ?? [])].sort((a, b) => {
    const orderA = MEAL_TYPE_ORDER[a.meal_type as keyof typeof MEAL_TYPE_ORDER] ?? 99
    const orderB = MEAL_TYPE_ORDER[b.meal_type as keyof typeof MEAL_TYPE_ORDER] ?? 99
    return orderA - orderB
  })

  return NextResponse.json({ success: true, data: sorted as MealLog[] })
}

// POST /api/health/meals — 식사 기록 생성
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

  let body: CreateMealInput
  try {
    body = await request.json() as CreateMealInput
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 식사 유형 필수 검증
  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack']
  if (!body.meal_type || !validMealTypes.includes(body.meal_type)) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 식사 유형입니다 (breakfast/lunch/dinner/snack)' },
      { status: 400 }
    )
  }

  // 음식명 필수 검증
  if (!body.food_name || typeof body.food_name !== 'string' || body.food_name.trim() === '') {
    return NextResponse.json(
      { success: false, error: '음식명은 필수입니다' },
      { status: 400 }
    )
  }

  // 칼로리 검증 (입력된 경우)
  if (body.calories !== undefined && body.calories !== null) {
    if (typeof body.calories !== 'number' || body.calories < 0) {
      return NextResponse.json(
        { success: false, error: '칼로리는 0 이상의 숫자여야 합니다' },
        { status: 400 }
      )
    }
  }

  // 날짜 형식 검증
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (body.date && !datePattern.test(body.date)) {
    return NextResponse.json(
      { success: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  const insertData = {
    user_id: user.id,
    meal_type: body.meal_type,
    food_name: body.food_name.trim(),
    calories: body.calories ?? null,
    protein: body.protein ?? null,
    carbs: body.carbs ?? null,
    fat: body.fat ?? null,
    date: body.date ?? new Date().toISOString().split('T')[0],
  }

  const { data, error } = await supabase
    .from('meal_logs')
    .insert(insertData)
    .select('id, user_id, meal_type, food_name, calories, protein, carbs, fat, date, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '식사 기록 생성에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as MealLog }, { status: 201 })
}
