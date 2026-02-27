import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { CreateTimeBlockInput, TimeBlock } from '@/types/time-block'

// GET /api/time-blocks?date=YYYY-MM-DD — 특정 날짜의 시간 블록 목록 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const month = searchParams.get('month')  // YYYY-MM 형식 (월 전체 조회용)

  // 날짜 또는 월 파라미터 중 하나는 필수
  if (!date && !month) {
    return apiError('VALIDATION_ERROR')
  }

  let query = supabase
    .from('time_blocks')
    .select('id, user_id, title, date, start_time, end_time, color, todo_id, created_at, updated_at')
    .eq('user_id', userId)

  if (date) {
    query = query.eq('date', date)
  } else if (month) {
    // YYYY-MM → 해당 월의 첫날~마지막날 범위 조회
    const startDate = `${month}-01`
    const [y, m] = month.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('date', startDate).lte('date', endDate)
  }

  const { data, error } = await query.order('start_time', { ascending: true })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as TimeBlock[] })
}

// POST /api/time-blocks — 시간 블록 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

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
