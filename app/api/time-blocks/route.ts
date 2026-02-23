import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateTimeBlockInput, TimeBlock } from '@/types/time-block'

// GET /api/time-blocks?date=YYYY-MM-DD — 특정 날짜의 시간 블록 목록 조회
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
  const date = searchParams.get('date')

  // 날짜 파라미터 검증
  if (!date) {
    return NextResponse.json(
      { success: false, error: 'date 파라미터가 필요합니다 (YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('time_blocks')
    .select('id, user_id, title, date, start_time, end_time, color, todo_id, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('date', date)
    .order('start_time', { ascending: true })

  if (error) {
    return NextResponse.json(
      { success: false, error: '시간 블록 조회에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as TimeBlock[] })
}

// POST /api/time-blocks — 시간 블록 생성
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

  let body: CreateTimeBlockInput
  try {
    body = await request.json() as CreateTimeBlockInput
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 필수 필드 검증
  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return NextResponse.json(
      { success: false, error: '제목은 필수입니다' },
      { status: 400 }
    )
  }

  if (!body.start_time || !body.end_time) {
    return NextResponse.json(
      { success: false, error: '시작 시각과 종료 시각은 필수입니다' },
      { status: 400 }
    )
  }

  // HH:MM 형식 검증
  const timeRegex = /^\d{2}:\d{2}$/
  if (!timeRegex.test(body.start_time) || !timeRegex.test(body.end_time)) {
    return NextResponse.json(
      { success: false, error: '시각 형식이 올바르지 않습니다 (HH:MM)' },
      { status: 400 }
    )
  }

  // 시작 시각 < 종료 시각 검증
  if (body.start_time >= body.end_time) {
    return NextResponse.json(
      { success: false, error: '종료 시각은 시작 시각 이후여야 합니다' },
      { status: 400 }
    )
  }

  // 오늘 날짜 기본값
  const today = new Date().toISOString().split('T')[0]

  const insertData = {
    user_id: user.id,
    title: body.title.trim(),
    date: body.date ?? today,
    start_time: body.start_time,
    end_time: body.end_time,
    color: body.color ?? null,
    todo_id: body.todo_id ?? null,
  }

  const { data, error } = await supabase
    .from('time_blocks')
    .insert(insertData)
    .select('id, user_id, title, date, start_time, end_time, color, todo_id, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '시간 블록 생성에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as TimeBlock }, { status: 201 })
}
