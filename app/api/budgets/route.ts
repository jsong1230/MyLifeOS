import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CreateBudgetInput, BudgetStatus } from '@/types/budget'

/**
 * 월 문자열 'YYYY-MM'에서 시작일/종료일 계산
 * 예: '2026-02' → { start: '2026-02-01', end: '2026-03-01' }
 */
function getMonthRange(yearMonth: string): { start: string; end: string } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth)
  if (!match) return null

  const year = parseInt(match[1], 10)
  const month = parseInt(match[2], 10)

  if (month < 1 || month > 12) return null

  const start = `${yearMonth}-01`
  // 다음 달 1일 계산 (월 경계 처리)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  return { start, end }
}

/**
 * GET /api/budgets
 * 특정 월 예산 목록 + 해당 월 지출 합계 조회
 * 쿼리 파라미터: month (YYYY-MM, 기본값: 현재 월)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
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

    // month 파라미터 처리 (기본값: 현재 월)
    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const targetMonth = monthParam ?? currentMonth

    // YYYY-MM 형식 검증
    const monthRange = getMonthRange(targetMonth)
    if (!monthRange) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 월 형식입니다 (YYYY-MM)' },
        { status: 400 }
      )
    }

    // 해당 월 예산 목록 조회 (카테고리 조인)
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select(
        'id, user_id, category_id, amount, year_month, created_at, updated_at, category:categories(id, name, icon, color, type, is_system, sort_order, created_at)'
      )
      .eq('user_id', user.id)
      .eq('year_month', targetMonth)
      .order('created_at', { ascending: true })

    if (budgetsError) {
      return NextResponse.json(
        { success: false, error: '예산 목록을 조회할 수 없습니다' },
        { status: 500 }
      )
    }

    if (!budgets || budgets.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 해당 월 지출 트랜잭션 일괄 조회 (N+1 방지)
    // 예산에 포함된 카테고리 ID 목록
    const categoryIds = budgets
      .map((b) => b.category_id)
      .filter((id): id is string => id !== null && id !== undefined)

    // 카테고리별 지출 합계 조회
    const { data: spentData, error: spentError } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('user_id', user.id)
      .eq('type', 'expense')
      .gte('date', monthRange.start)
      .lt('date', monthRange.end)
      .in('category_id', categoryIds.length > 0 ? categoryIds : [''])

    if (spentError) {
      return NextResponse.json(
        { success: false, error: '지출 데이터를 조회할 수 없습니다' },
        { status: 500 }
      )
    }

    // 카테고리 ID → 지출 합계 매핑
    const spentMap = new Map<string, number>()
    for (const tx of spentData ?? []) {
      if (tx.category_id) {
        const prev = spentMap.get(tx.category_id) ?? 0
        spentMap.set(tx.category_id, prev + Number(tx.amount))
      }
    }

    // BudgetStatus 계산
    const result: BudgetStatus[] = budgets.map((budget) => {
      const spent = budget.category_id ? (spentMap.get(budget.category_id) ?? 0) : 0
      const amount = Number(budget.amount)
      const remaining = amount - spent
      const percentage = amount > 0 ? Math.round((spent / amount) * 100) : 0

      return {
        id: budget.id,
        user_id: budget.user_id,
        category_id: budget.category_id ?? null,
        // Supabase 조인 결과는 배열 또는 객체일 수 있어 정규화
        category: Array.isArray(budget.category)
          ? (budget.category[0] ?? null)
          : (budget.category ?? null),
        amount,
        year_month: budget.year_month,
        created_at: budget.created_at,
        updated_at: budget.updated_at,
        spent,
        remaining,
        percentage,
      }
    })

    return NextResponse.json({ success: true, data: result })
  } catch {
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/budgets
 * 예산 생성 (upsert: 같은 user+category+month면 업데이트)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 인증 확인
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

    let body: CreateBudgetInput
    try {
      body = (await request.json()) as CreateBudgetInput
    } catch {
      return NextResponse.json(
        { success: false, error: '잘못된 요청 형식입니다' },
        { status: 400 }
      )
    }

    // 필수 입력값 검증
    if (body.amount === undefined || body.amount === null) {
      return NextResponse.json(
        { success: false, error: '예산 금액은 필수입니다' },
        { status: 400 }
      )
    }

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return NextResponse.json(
        { success: false, error: '예산 금액은 0보다 큰 숫자여야 합니다' },
        { status: 400 }
      )
    }

    if (!body.year_month) {
      return NextResponse.json(
        { success: false, error: '예산 월은 필수입니다' },
        { status: 400 }
      )
    }

    const monthRange = getMonthRange(body.year_month)
    if (!monthRange) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 월 형식입니다 (YYYY-MM)' },
        { status: 400 }
      )
    }

    // upsert: user_id + category_id + year_month 복합 유니크 조건으로 충돌 시 업데이트
    const { data: budget, error: upsertError } = await supabase
      .from('budgets')
      .upsert(
        {
          user_id: user.id,
          category_id: body.category_id ?? null,
          amount: body.amount,
          year_month: body.year_month,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,category_id,year_month',
          ignoreDuplicates: false,
        }
      )
      .select(
        'id, user_id, category_id, amount, year_month, created_at, updated_at, category:categories(id, name, icon, color, type, is_system, sort_order, created_at)'
      )
      .maybeSingle()

    if (upsertError || !budget) {
      return NextResponse.json(
        { success: false, error: '예산 저장에 실패했습니다' },
        { status: 500 }
      )
    }

    const normalizedBudget = {
      ...budget,
      amount: Number(budget.amount),
      category: Array.isArray(budget.category)
        ? (budget.category[0] ?? null)
        : (budget.category ?? null),
    }

    return NextResponse.json(
      { success: true, data: normalizedBudget },
      { status: 201 }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
