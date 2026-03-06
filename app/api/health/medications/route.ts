import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday } from '@/lib/date-utils'
import type { CreateMedicationInput, MedicationWithLog } from '@/types/medication'

// GET /api/health/medications — 활성 복약 목록 + 오늘 복용 여부
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const today = getToday()

  // 활성 복약 목록 조회
  const { data: medications, error: medError } = await supabase
    .from('medications')
    .select('id, user_id, name, dosage, frequency, times, is_active, created_at, updated_at')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  if (medError) {
    return apiError('SERVER_ERROR')
  }

  if (!medications || medications.length === 0) {
    return NextResponse.json({ success: true, data: [] as MedicationWithLog[] })
  }

  // 오늘 복용 기록 조회
  const medicationIds = medications.map((m) => m.id)
  const { data: logs, error: logError } = await supabase
    .from('medication_logs')
    .select('medication_id')
    .eq('user_id', userId)
    .eq('date', today)
    .in('medication_id', medicationIds)

  if (logError) {
    return apiError('SERVER_ERROR')
  }

  const takenSet = new Set((logs ?? []).map((l) => l.medication_id))

  const data: MedicationWithLog[] = medications.map((m) => ({
    ...m,
    taken_today: takenSet.has(m.id),
  }))

  return NextResponse.json({ success: true, data })
}

// POST /api/health/medications — 새 약 등록
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: CreateMedicationInput
  try {
    body = await request.json() as CreateMedicationInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return apiError('VALIDATION_ERROR')
  }

  const validFrequencies = ['daily', 'weekly', 'as_needed']
  if (body.frequency && !validFrequencies.includes(body.frequency)) {
    return apiError('VALIDATION_ERROR')
  }

  const insertData = {
    user_id: userId,
    name: body.name.trim(),
    dosage: body.dosage?.trim() ?? null,
    frequency: body.frequency ?? 'daily',
    times: body.times ?? ['08:00'],
    is_active: true,
  }

  const { data, error } = await supabase
    .from('medications')
    .insert(insertData)
    .select('id, user_id, name, dosage, frequency, times, is_active, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data }, { status: 201 })
}
