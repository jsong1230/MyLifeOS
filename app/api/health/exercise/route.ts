import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ExerciseLog, CreateExerciseInput } from '@/types/health'

const VALID_INTENSITIES = ['light', 'moderate', 'intense'] as const

// GET /api/health/exercise?week_start=YYYY-MM-DD → 주간 운동 기록
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('week_start')

  let query = supabase
    .from('exercise_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (weekStart) {
    const startDate = new Date(weekStart + 'T00:00:00')
    const endDate = new Date(weekStart + 'T00:00:00')
    endDate.setDate(endDate.getDate() + 6)
    const endStr = endDate.toISOString().split('T')[0]
    query = query.gte('date', weekStart).lte('date', endStr)
  } else {
    query = query.limit(30)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ success: false, error: '운동 기록 조회에 실패했습니다' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: (data ?? []) as ExerciseLog[] })
}

// POST /api/health/exercise → 운동 기록 추가
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: '인증이 필요합니다' }, { status: 401 })
  }

  let body: CreateExerciseInput
  try {
    body = await request.json() as CreateExerciseInput
  } catch {
    return NextResponse.json({ success: false, error: '잘못된 요청 형식입니다' }, { status: 400 })
  }

  if (!body.exercise_type?.trim()) {
    return NextResponse.json({ success: false, error: '운동 종류를 입력해주세요' }, { status: 400 })
  }
  if (!body.duration_min || body.duration_min <= 0) {
    return NextResponse.json({ success: false, error: '운동 시간은 1분 이상이어야 합니다' }, { status: 400 })
  }
  if (!VALID_INTENSITIES.includes(body.intensity)) {
    return NextResponse.json({ success: false, error: '유효하지 않은 강도입니다' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('exercise_logs')
    .insert({
      user_id: user.id,
      exercise_type: body.exercise_type.trim(),
      duration_min: body.duration_min,
      intensity: body.intensity,
      calories_burned: body.calories_burned ?? null,
      date: body.date ?? new Date().toISOString().split('T')[0],
      note: body.note ?? null,
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json({ success: false, error: '운동 기록 추가에 실패했습니다' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data as ExerciseLog }, { status: 201 })
}
