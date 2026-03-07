import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { CreateMeasurementInput, HealthMeasurement } from '@/types/health_measurement'

// GET /api/health/measurements?type=blood_pressure&days=30
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const daysParam = searchParams.get('days')

  // type 검증
  const validTypes = ['blood_pressure', 'blood_sugar', 'body_temp']
  if (type && !validTypes.includes(type)) {
    return apiError('VALIDATION_ERROR')
  }

  // days 검증 (양수 정수)
  let days = 30
  if (daysParam) {
    const parsed = parseInt(daysParam, 10)
    if (isNaN(parsed) || parsed <= 0) {
      return apiError('VALIDATION_ERROR')
    }
    days = parsed
  }

  // days 이전 날짜 계산
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString()

  let query = supabase
    .from('health_measurements')
    .select('id, user_id, type, value, value2, unit, measured_at, note, created_at')
    .eq('user_id', user.id)
    .gte('measured_at', sinceStr)
    .order('measured_at', { ascending: false })

  if (type) {
    query = query.eq('type', type)
  }

  const { data, error } = await query

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: data as HealthMeasurement[] })
}

// POST /api/health/measurements — 신규 기록 추가
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  let body: CreateMeasurementInput
  try {
    body = await request.json() as CreateMeasurementInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 필수 필드 검증
  const validTypes = ['blood_pressure', 'blood_sugar', 'body_temp']
  if (!body.type || !validTypes.includes(body.type)) {
    return apiError('VALIDATION_ERROR')
  }
  if (typeof body.value !== 'number' || isNaN(body.value)) {
    return apiError('VALIDATION_ERROR')
  }
  if (!body.unit || typeof body.unit !== 'string') {
    return apiError('VALIDATION_ERROR')
  }
  // 혈압은 value2(이완기) 필수
  if (body.type === 'blood_pressure' && (typeof body.value2 !== 'number' || isNaN(body.value2))) {
    return apiError('VALIDATION_ERROR')
  }

  const insertData = {
    user_id: user.id,
    type: body.type,
    value: body.value,
    value2: body.value2 ?? null,
    unit: body.unit,
    measured_at: body.measured_at ?? new Date().toISOString(),
    note: body.note ?? null,
  }

  const { data, error } = await supabase
    .from('health_measurements')
    .insert(insertData)
    .select('id, user_id, type, value, value2, unit, measured_at, note, created_at')
    .maybeSingle()

  if (error) return apiError('SERVER_ERROR')

  return NextResponse.json({ success: true, data: data as HealthMeasurement }, { status: 201 })
}
