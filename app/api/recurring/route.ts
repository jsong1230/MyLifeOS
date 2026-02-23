import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateRecurringInput, RecurringExpense } from '@/types/recurring'

// GET /api/recurring — 정기 지출 목록 조회 (활성 항목 우선 정렬)
export async function GET() {
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

  const { data, error } = await supabase
    .from('recurring_expenses')
    .select('id, user_id, name, amount, billing_day, cycle, category_id, is_active, created_at, updated_at')
    .eq('user_id', user.id)
    .order('is_active', { ascending: false })
    .order('billing_day', { ascending: true })

  if (error) {
    return NextResponse.json(
      { success: false, error: '정기 지출 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as RecurringExpense[] })
}

// POST /api/recurring — 정기 지출 등록
export async function POST(request: NextRequest) {
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

  let body: CreateRecurringInput
  try {
    body = await request.json() as CreateRecurringInput
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 이름 필수 검증
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return NextResponse.json(
      { success: false, error: '이름은 필수입니다' },
      { status: 400 }
    )
  }

  // 금액 검증
  if (body.amount === undefined || body.amount === null) {
    return NextResponse.json(
      { success: false, error: '금액은 필수입니다' },
      { status: 400 }
    )
  }

  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return NextResponse.json(
      { success: false, error: '금액은 0보다 커야 합니다' },
      { status: 400 }
    )
  }

  // 결제일 검증 (1-31)
  if (
    body.billing_day === undefined ||
    !Number.isInteger(body.billing_day) ||
    body.billing_day < 1 ||
    body.billing_day > 31
  ) {
    return NextResponse.json(
      { success: false, error: '결제일은 1에서 31 사이의 정수여야 합니다' },
      { status: 400 }
    )
  }

  // 주기 검증
  if (!body.cycle || !['monthly', 'yearly'].includes(body.cycle)) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 주기입니다' },
      { status: 400 }
    )
  }

  const insertData = {
    user_id: user.id,
    name: body.name.trim(),
    amount: body.amount,
    billing_day: body.billing_day,
    cycle: body.cycle,
    category_id: body.category_id ?? null,
    is_active: true,
  }

  const { data, error } = await supabase
    .from('recurring_expenses')
    .insert(insertData)
    .select('id, user_id, name, amount, billing_day, cycle, category_id, is_active, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '정기 지출 등록에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { success: true, data: data as RecurringExpense },
    { status: 201 }
  )
}
