import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateSleepInput, SleepLog } from '@/types/health'

// HH:MM → 분 변환
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// 수면 시간 계산 (자정 초과 처리)
function calcSleepHours(start: string, end: string): number {
  let startMin = timeToMinutes(start)
  let endMin = timeToMinutes(end)
  if (endMin <= startMin) endMin += 24 * 60 // 자정 넘김
  return Math.round(((endMin - startMin) / 60) * 10) / 10 // 소수점 1자리
}

const TIME_PATTERN = /^\d{2}:\d{2}$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

// PATCH /api/health/sleep/[id] — 수면 기록 수정
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

  // 기존 기록 조회 (소유권 확인 포함)
  const { data: existing, error: fetchError } = await supabase
    .from('health_logs')
    .select('id, user_id, value, value2, date, time_start, time_end, note, created_at, updated_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('log_type', 'sleep')
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json(
      { success: false, error: '수면 기록 조회에 실패했습니다' },
      { status: 500 }
    )
  }

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '수면 기록을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  let body: UpdateSleepInput
  try {
    body = (await request.json()) as UpdateSleepInput
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // time_start 형식 검증
  if (body.time_start !== undefined && !TIME_PATTERN.test(body.time_start)) {
    return NextResponse.json(
      { success: false, error: '취침 시각은 HH:MM 형식으로 입력해주세요' },
      { status: 400 }
    )
  }

  // time_end 형식 검증
  if (body.time_end !== undefined && !TIME_PATTERN.test(body.time_end)) {
    return NextResponse.json(
      { success: false, error: '기상 시각은 HH:MM 형식으로 입력해주세요' },
      { status: 400 }
    )
  }

  // 수면 질 범위 검증 (1-5)
  if (body.value2 !== undefined && body.value2 !== null) {
    if (typeof body.value2 !== 'number' || body.value2 < 1 || body.value2 > 5) {
      return NextResponse.json(
        { success: false, error: '수면 질은 1~5 사이의 값이어야 합니다' },
        { status: 400 }
      )
    }
  }

  // 날짜 형식 검증
  if (body.date && !DATE_PATTERN.test(body.date)) {
    return NextResponse.json(
      { success: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
      { status: 400 }
    )
  }

  // time_start 또는 time_end 변경 시 수면 시간 재계산
  const newStart = body.time_start ?? (existing as SleepLog).time_start
  const newEnd = body.time_end ?? (existing as SleepLog).time_end

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.time_start !== undefined) updateData.time_start = body.time_start
  if (body.time_end !== undefined) updateData.time_end = body.time_end
  if (body.date !== undefined) updateData.date = body.date
  if (body.note !== undefined) updateData.note = body.note
  if (body.value2 !== undefined) updateData.value2 = body.value2

  // 시간 변경이 있는 경우 수면 시간 재계산
  if ((body.time_start !== undefined || body.time_end !== undefined) && newStart && newEnd) {
    updateData.value = calcSleepHours(newStart, newEnd)
  }

  const { data, error } = await supabase
    .from('health_logs')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select(
      'id, user_id, value, value2, date, time_start, time_end, note, created_at, updated_at'
    )
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '수면 기록 수정에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as SleepLog })
}

// DELETE /api/health/sleep/[id] — 수면 기록 삭제
export async function DELETE(
  _request: NextRequest,
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

  // 소유권 확인
  const { data: existing } = await supabase
    .from('health_logs')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('log_type', 'sleep')
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '수면 기록을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from('health_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { success: false, error: '수면 기록 삭제에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
