import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { CreateRecurringInput, RecurringExpense } from '@/types/recurring'

// GET /api/recurring — 정기 지출 목록 조회 (활성 항목 우선 정렬)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('id, user_id, name, amount, billing_day, cycle, category_id, is_active, currency, created_at, updated_at')
    .eq('user_id', userId)
    .order('is_active', { ascending: false })
    .order('billing_day', { ascending: true })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as RecurringExpense[] })
}

// POST /api/recurring — 정기 지출 등록
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: CreateRecurringInput
  try {
    body = await request.json() as CreateRecurringInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 이름 필수 검증
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return apiError('VALIDATION_ERROR')
  }

  // 금액 검증
  if (body.amount === undefined || body.amount === null) {
    return apiError('VALIDATION_ERROR')
  }

  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return apiError('VALIDATION_ERROR')
  }

  // 결제일 검증 (1-31)
  if (
    body.billing_day === undefined ||
    !Number.isInteger(body.billing_day) ||
    body.billing_day < 1 ||
    body.billing_day > 31
  ) {
    return apiError('VALIDATION_ERROR')
  }

  // 주기 검증
  if (!body.cycle || !['monthly', 'yearly'].includes(body.cycle)) {
    return apiError('VALIDATION_ERROR')
  }

  const insertData = {
    user_id: userId,
    name: body.name.trim(),
    amount: body.amount,
    billing_day: body.billing_day,
    cycle: body.cycle,
    category_id: body.category_id ?? null,
    is_active: true,
    currency: body.currency ?? 'KRW',
  }

  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert(insertData)
    .select('id, user_id, name, amount, billing_day, cycle, category_id, is_active, currency, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json(
    { success: true, data: data as RecurringExpense },
    { status: 201 }
  )
}
