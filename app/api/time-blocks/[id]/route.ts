import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateTimeBlockInput, TimeBlock } from '@/types/time-block'

// PATCH /api/time-blocks/[id] — 시간 블록 수정
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

  let body: UpdateTimeBlockInput
  try {
    body = await request.json() as UpdateTimeBlockInput
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 제목이 있으면 빈 문자열 방지
  if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim() === '')) {
    return NextResponse.json(
      { success: false, error: '제목은 비워둘 수 없습니다' },
      { status: 400 }
    )
  }

  // HH:MM 형식 검증 (제공된 경우)
  const timeRegex = /^\d{2}:\d{2}$/
  if (body.start_time && !timeRegex.test(body.start_time)) {
    return NextResponse.json(
      { success: false, error: '시작 시각 형식이 올바르지 않습니다 (HH:MM)' },
      { status: 400 }
    )
  }
  if (body.end_time && !timeRegex.test(body.end_time)) {
    return NextResponse.json(
      { success: false, error: '종료 시각 형식이 올바르지 않습니다 (HH:MM)' },
      { status: 400 }
    )
  }

  // 해당 시간 블록이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('time_blocks')
    .select('id, start_time, end_time')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '시간 블록을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  // 시작/종료 시각 일관성 검증 (둘 다 제공되거나 기존 값과 조합)
  const finalStart = body.start_time ?? (existing as { start_time: string }).start_time
  const finalEnd = body.end_time ?? (existing as { end_time: string }).end_time
  if (finalStart >= finalEnd) {
    return NextResponse.json(
      { success: false, error: '종료 시각은 시작 시각 이후여야 합니다' },
      { status: 400 }
    )
  }

  const updateData: Record<string, unknown> = {
    ...body,
    updated_at: new Date().toISOString(),
  }

  // 제목 공백 제거
  if (body.title) {
    updateData.title = body.title.trim()
  }

  const { data, error } = await supabase
    .from('time_blocks')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, title, date, start_time, end_time, color, todo_id, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '시간 블록 수정에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as TimeBlock })
}

// DELETE /api/time-blocks/[id] — 시간 블록 삭제
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

  // 해당 시간 블록이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('time_blocks')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '시간 블록을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from('time_blocks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { success: false, error: '시간 블록 삭제에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: null })
}
