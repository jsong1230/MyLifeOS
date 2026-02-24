import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
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
    return apiError('AUTH_REQUIRED')
  }

  const { id } = await params

  if (!id) {
    return apiError('VALIDATION_ERROR')
  }

  let body: UpdateTimeBlockInput
  try {
    body = await request.json() as UpdateTimeBlockInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 제목이 있으면 빈 문자열 방지
  if (body.title !== undefined && (typeof body.title !== 'string' || body.title.trim() === '')) {
    return apiError('VALIDATION_ERROR')
  }

  // HH:MM 형식 검증 (제공된 경우)
  const timeRegex = /^\d{2}:\d{2}$/
  if (body.start_time && !timeRegex.test(body.start_time)) {
    return apiError('VALIDATION_ERROR')
  }
  if (body.end_time && !timeRegex.test(body.end_time)) {
    return apiError('VALIDATION_ERROR')
  }

  // 해당 시간 블록이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('time_blocks')
    .select('id, start_time, end_time')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  // 시작/종료 시각 일관성 검증 (둘 다 제공되거나 기존 값과 조합)
  const finalStart = body.start_time ?? (existing as { start_time: string }).start_time
  const finalEnd = body.end_time ?? (existing as { end_time: string }).end_time
  if (finalStart >= finalEnd) {
    return apiError('VALIDATION_ERROR')
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
    return apiError('SERVER_ERROR')
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
    return apiError('AUTH_REQUIRED')
  }

  const { id } = await params

  if (!id) {
    return apiError('VALIDATION_ERROR')
  }

  // 해당 시간 블록이 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('time_blocks')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  const { error } = await supabase
    .from('time_blocks')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
