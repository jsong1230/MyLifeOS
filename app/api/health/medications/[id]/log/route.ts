import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday } from '@/lib/date-utils'
import type { MedicationLog } from '@/types/medication'

// POST /api/health/medications/[id]/log — 오늘 복용 체크인 (upsert)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { id: medicationId } = await params

  if (!medicationId) return apiError('VALIDATION_ERROR')

  // 약이 해당 사용자 소유인지 확인
  const { data: medication } = await supabase
    .from('medications')
    .select('id')
    .eq('id', medicationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!medication) return apiError('NOT_FOUND')

  let body: { date?: string } = {}
  try {
    body = await request.json() as { date?: string }
  } catch {
    // body 없어도 OK — 오늘 날짜 사용
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  const date = body.date && datePattern.test(body.date) ? body.date : getToday()

  const { data, error } = await supabase
    .from('medication_logs')
    .upsert(
      {
        user_id: userId,
        medication_id: medicationId,
        date,
        taken_at: new Date().toISOString(),
      },
      { onConflict: 'medication_id,date' }
    )
    .select('id, user_id, medication_id, date, taken_at, created_at')
    .maybeSingle()

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: data as MedicationLog }, { status: 201 })
}

// DELETE /api/health/medications/[id]/log — 복용 체크인 취소
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { id: medicationId } = await params

  if (!medicationId) return apiError('VALIDATION_ERROR')

  const { searchParams } = new URL(request.url)
  const rawDate = searchParams.get('date')
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  const date = rawDate && datePattern.test(rawDate) ? rawDate : getToday()

  const { error } = await supabase
    .from('medication_logs')
    .delete()
    .eq('medication_id', medicationId)
    .eq('user_id', userId)
    .eq('date', date)

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: null })
}
