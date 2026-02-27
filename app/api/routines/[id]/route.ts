import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { UpdateRoutineInput } from '@/types/routine'

/**
 * PATCH /api/routines/[id]
 * 루틴 수정 (제목, 빈도, 요일, 간격, 시간, 활성 여부)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('AUTH_REQUIRED')
    const userId = user.id

    const { id } = await params

    if (!id) {
      return apiError('VALIDATION_ERROR')
    }

    // 루틴 존재 여부 및 소유권 확인
    const { data: existing, error: fetchError } = await supabase
      .from('routines')
      .select('id, user_id, frequency')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      return apiError('SERVER_ERROR')
    }

    if (!existing) {
      return apiError('NOT_FOUND')
    }

    const body = (await request.json()) as UpdateRoutineInput

    // 입력값 검증
    if (body.title !== undefined && body.title.trim() === '') {
      return apiError('VALIDATION_ERROR')
    }

    if (
      body.frequency !== undefined &&
      !['daily', 'weekly', 'custom'].includes(body.frequency)
    ) {
      return apiError('VALIDATION_ERROR')
    }

    // 업데이트할 데이터 구성
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (body.title !== undefined) updateData.title = body.title.trim()
    if (body.description !== undefined) updateData.description = body.description
    if (body.frequency !== undefined) {
      updateData.frequency = body.frequency
      // 주기가 변경되면 관련 필드 초기화
      if (body.frequency === 'daily') {
        updateData.days_of_week = null
        updateData.interval_days = null
      } else if (body.frequency === 'weekly') {
        updateData.interval_days = null
      } else if (body.frequency === 'custom') {
        updateData.days_of_week = null
      }
    }
    if (body.days_of_week !== undefined) updateData.days_of_week = body.days_of_week
    if (body.interval_days !== undefined) updateData.interval_days = body.interval_days
    if (body.time_of_day !== undefined) updateData.time_of_day = body.time_of_day
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data: updated, error: updateError } = await supabase
      .from('routines')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(
        'id, user_id, title, description, frequency, days_of_week, interval_days, time_of_day, streak, is_active, created_at, updated_at'
      )
      .maybeSingle()

    if (updateError || !updated) {
      return apiError('SERVER_ERROR')
    }

    return NextResponse.json({ success: true, data: updated })
  } catch {
    return apiError('SERVER_ERROR')
  }
}

/**
 * DELETE /api/routines/[id]
 * 루틴 삭제 (cascade: routine_logs도 삭제됨)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('AUTH_REQUIRED')
    const userId = user.id

    const { id } = await params

    if (!id) {
      return apiError('VALIDATION_ERROR')
    }

    // 소유권 확인
    const { data: existing, error: fetchError } = await supabase
      .from('routines')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      return apiError('SERVER_ERROR')
    }

    if (!existing) {
      return apiError('NOT_FOUND')
    }

    const { error: deleteError } = await supabase
      .from('routines')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (deleteError) {
      return apiError('SERVER_ERROR')
    }

    return NextResponse.json({ success: true, data: { id } })
  } catch {
    return apiError('SERVER_ERROR')
  }
}
