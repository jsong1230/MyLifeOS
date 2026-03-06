import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday } from '@/lib/date-utils'
import type { CreateWaterInput, WaterLog } from '@/types/health'

// GET /api/health/water — 날짜별 수분 섭취 목록 + 합계 조회
// 쿼리 파라미터: date (YYYY-MM-DD, 기본값: 오늘)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { searchParams } = new URL(request.url)
  const rawDate = searchParams.get('date')

  // 날짜 파라미터 검증: YYYY-MM-DD 형식
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  let targetDate: string

  if (rawDate) {
    if (!datePattern.test(rawDate)) {
      return apiError('VALIDATION_ERROR')
    }
    targetDate = rawDate
  } else {
    // 기본값: 오늘 날짜
    targetDate = getToday()
  }

  const { data, error } = await supabase
    .from('water_logs')
    .select('id, user_id, amount_ml, date, created_at')
    .eq('user_id', userId)
    .eq('date', targetDate)
    .order('created_at', { ascending: true })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  // 오늘 총 수분 섭취량(ml) 합산
  const total_ml = (data ?? []).reduce((sum, log) => sum + log.amount_ml, 0)

  return NextResponse.json({
    success: true,
    data: data as WaterLog[],
    total_ml,
  })
}

// POST /api/health/water — 수분 섭취 기록 추가
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: CreateWaterInput
  try {
    body = await request.json() as CreateWaterInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // amount_ml 필수 검증 (양수 정수)
  if (
    typeof body.amount_ml !== 'number' ||
    !Number.isInteger(body.amount_ml) ||
    body.amount_ml <= 0
  ) {
    return apiError('VALIDATION_ERROR')
  }

  // 날짜 형식 검증
  const datePattern = /^\d{4}-\d{2}-\d{2}$/
  if (body.date && !datePattern.test(body.date)) {
    return apiError('VALIDATION_ERROR')
  }

  const insertData = {
    user_id: userId,
    amount_ml: body.amount_ml,
    date: body.date ?? getToday(),
  }

  const { data, error } = await supabase
    .from('water_logs')
    .insert(insertData)
    .select('id, user_id, amount_ml, date, created_at')
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as WaterLog }, { status: 201 })
}
