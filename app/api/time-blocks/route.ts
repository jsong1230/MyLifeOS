import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { CreateTimeBlockInput, TimeBlock } from '@/types/time-block'

// GET /api/time-blocks?date=YYYY-MM-DD — 특정 날짜의 시간 블록 목록 조회
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return apiError('AUTH_REQUIRED')
  }
  const supabase = await createClient()

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  // 날짜 파라미터 검증
  if (!date) {
    return apiError('VALIDATION_ERROR')
  }

  const { data, error } = await supabase
    .from('time_blocks')
    .select('id, user_id, title, date, start_time, end_time, color, todo_id, created_at, updated_at')
    .eq('user_id', userId)
    .eq('date', date)
    .order('start_time', { ascending: true })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as TimeBlock[] })
}

// POST /api/time-blocks — 시간 블록 생성
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return apiError('AUTH_REQUIRED')
  }
  const supabase = await createClient()

  let body: CreateTimeBlockInput
  try {
    body = await request.json() as CreateTimeBlockInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 필수 필드 검증
  if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
    return apiError('VALIDATION_ERROR')
  }

  if (!body.start_time || !body.end_time) {
    return apiError('VALIDATION_ERROR')
  }

  // HH:MM 형식 검증
  const timeRegex = /^\d{2}:\d{2}$/
  if (!timeRegex.test(body.start_time) || !timeRegex.test(body.end_time)) {
    return apiError('VALIDATION_ERROR')
  }

  // 시작 시각 < 종료 시각 검증
  if (body.start_time >= body.end_time) {
    return apiError('VALIDATION_ERROR')
  }

  // 오늘 날짜 기본값
  const today = new Date().toISOString().split('T')[0]

  const insertData = {
    user_id: userId,
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
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as TimeBlock }, { status: 201 })
}
