import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getUserDefaultCurrency } from '@/lib/user-defaults'
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
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id
    if (!userId) return apiError('AUTH_REQUIRED')

    // month 파라미터 처리 (기본값: 현재 월)
    const { searchParams } = new URL(request.url)
    const monthParam = searchParams.get('month')
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const targetMonth = monthParam ?? currentMonth

    // YYYY-MM 형식 검증
    const monthRange = getMonthRange(targetMonth)
    if (!monthRange) {
      return apiError('VALIDATION_ERROR')
    }

    // 해당 월 예산 목록 조회 (카테고리 조인)
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select(
        'id, user_id, category_id, amount, year_month, currency, created_at, updated_at, category:categories(id, name, name_key, icon, color, type, is_system, sort_order, created_at)'
      )
      .eq('user_id', userId)
      .eq('year_month', targetMonth)
      .order('created_at', { ascending: true })

    if (budgetsError) {
      return apiError('SERVER_ERROR')
    }

    if (!budgets || budgets.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // 해당 월 지출 트랜잭션 일괄 조회 (N+1 방지)
    // 예산에 포함된 카테고리 ID 목록
    const categoryIds = budgets
      .map((b) => b.category_id)
      .filter((id): id is string => id !== null && id !== undefined)

    // 미분류(null) 예산이 있는지 확인
    const hasUncategorizedBudget = budgets.some((b) => b.category_id === null)

    // 카테고리별 지출 합계 조회 + 미분류 지출 별도 조회 (currency 포함 — 통화 일치 필터용)
    const [spentResult, uncategorizedResult] = await Promise.all([
      categoryIds.length > 0
        ? supabase
            .from('transactions')
            .select('category_id, amount, currency')
            .eq('user_id', userId)
            .eq('type', 'expense')
            .gte('date', monthRange.start)
            .lt('date', monthRange.end)
            .in('category_id', categoryIds)
        : Promise.resolve({ data: [], error: null }),
      hasUncategorizedBudget
        ? supabase
            .from('transactions')
            .select('amount, currency')
            .eq('user_id', userId)
            .eq('type', 'expense')
            .gte('date', monthRange.start)
            .lt('date', monthRange.end)
            .is('category_id', null)
        : Promise.resolve({ data: [], error: null }),
    ])

    if (spentResult.error || uncategorizedResult.error) {
      return apiError('SERVER_ERROR')
    }

    // 카테고리 ID → 통화 → 지출 합계 (2-level 매핑으로 통화 불일치 방지)
    const spentMap = new Map<string, Map<string, number>>()
    for (const tx of spentResult.data ?? []) {
      if (tx.category_id) {
        const currencyKey = (tx.currency ?? 'KRW') as string
        if (!spentMap.has(tx.category_id)) spentMap.set(tx.category_id, new Map())
        const currMap = spentMap.get(tx.category_id)!
        currMap.set(currencyKey, (currMap.get(currencyKey) ?? 0) + Number(tx.amount))
      }
    }

    // 미분류 지출: 통화 → 합계
    const uncategorizedByCurrency = new Map<string, number>()
    for (const tx of uncategorizedResult.data ?? []) {
      const currencyKey = (tx.currency ?? 'KRW') as string
      uncategorizedByCurrency.set(
        currencyKey,
        (uncategorizedByCurrency.get(currencyKey) ?? 0) + Number(tx.amount)
      )
    }

    // BudgetStatus 계산 (예산 통화와 동일한 지출만 집계)
    const result: BudgetStatus[] = budgets.map((budget) => {
      const budgetCurrency = (budget.currency ?? 'KRW') as string
      const spent = budget.category_id
        ? (spentMap.get(budget.category_id)?.get(budgetCurrency) ?? 0)
        : (uncategorizedByCurrency.get(budgetCurrency) ?? 0)
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
        currency: (budget.currency as import('@/lib/currency').CurrencyCode) ?? 'KRW',
        created_at: budget.created_at,
        updated_at: budget.updated_at,
        spent,
        remaining,
        percentage,
      }
    })

    return NextResponse.json({ success: true, data: result })
  } catch {
    return apiError('SERVER_ERROR')
  }
}

/**
 * POST /api/budgets
 * 예산 생성 (upsert: 같은 user+category+month면 업데이트)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return apiError('AUTH_REQUIRED')
    const userId = user.id

    let body: CreateBudgetInput
    try {
      body = (await request.json()) as CreateBudgetInput
    } catch {
      return apiError('VALIDATION_ERROR')
    }

    // 필수 입력값 검증
    if (body.amount === undefined || body.amount === null) {
      return apiError('VALIDATION_ERROR')
    }

    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return apiError('VALIDATION_ERROR')
    }

    if (!body.year_month) {
      return apiError('VALIDATION_ERROR')
    }

    const monthRange = getMonthRange(body.year_month)
    if (!monthRange) {
      return apiError('VALIDATION_ERROR')
    }

    // upsert: user_id + category_id + year_month 복합 유니크 조건으로 충돌 시 업데이트
    const { data: budget, error: upsertError } = await supabase
      .from('budgets')
      .upsert(
        {
          user_id: userId,
          category_id: body.category_id ?? null,
          amount: body.amount,
          year_month: body.year_month,
          currency: body.currency ?? await getUserDefaultCurrency(supabase, userId),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,category_id,year_month',
          ignoreDuplicates: false,
        }
      )
      .select(
        'id, user_id, category_id, amount, year_month, currency, created_at, updated_at, category:categories(id, name, name_key, icon, color, type, is_system, sort_order, created_at)'
      )
      .maybeSingle()

    if (upsertError || !budget) {
      return apiError('SERVER_ERROR')
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
    return apiError('SERVER_ERROR')
  }
}
