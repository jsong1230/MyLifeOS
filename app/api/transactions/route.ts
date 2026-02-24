import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { CreateTransactionInput, Transaction } from '@/types/transaction'

// GET /api/transactions — 거래 목록 조회
// 쿼리 파라미터: month (YYYY-MM), type (income/expense), category_id, is_favorite (true)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const type = searchParams.get('type')
  const categoryId = searchParams.get('category_id')
  const isFavorite = searchParams.get('is_favorite')

  // 카테고리 정보 조인하여 조회
  let query = supabase
    .from('transactions')
    .select(
      'id, user_id, amount, type, category_id, memo, date, is_favorite, currency, created_at, updated_at, category:categories(id, name, icon, color, type)'
    )
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  // 월 필터: YYYY-MM 형식으로 해당 월의 거래만 조회
  if (month) {
    const startDate = `${month}-01`
    const [year, monthNum] = month.split('-').map(Number)
    const lastDay = new Date(year, monthNum, 0).getDate()
    const endDate = `${month}-${String(lastDay).padStart(2, '0')}`
    query = query.gte('date', startDate).lte('date', endDate)
  }

  // 수입/지출 타입 필터
  if (type === 'income' || type === 'expense') {
    query = query.eq('type', type)
  }

  // 카테고리 필터
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  // 즐겨찾기 필터
  if (isFavorite === 'true') {
    query = query.eq('is_favorite', true)
  }

  const { data, error } = await query

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as unknown as Transaction[] })
}

// POST /api/transactions — 거래 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  let body: CreateTransactionInput
  try {
    body = await request.json()
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 금액 필수 검증
  if (body.amount === undefined || body.amount === null) {
    return apiError('VALIDATION_ERROR')
  }

  if (typeof body.amount !== 'number' || body.amount <= 0) {
    return apiError('VALIDATION_ERROR')
  }

  // 거래 타입 검증
  if (!body.type || !['income', 'expense'].includes(body.type)) {
    return apiError('VALIDATION_ERROR')
  }

  const insertData = {
    user_id: user.id,
    amount: body.amount,
    type: body.type,
    category_id: body.category_id ?? null,
    memo: body.memo ?? null,
    date: body.date ?? new Date().toISOString().split('T')[0],
    is_favorite: body.is_favorite ?? false,
    currency: body.currency ?? 'KRW',
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(insertData)
    .select(
      'id, user_id, amount, type, category_id, memo, date, is_favorite, currency, created_at, updated_at, category:categories(id, name, icon, color, type)'
    )
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as unknown as Transaction }, { status: 201 })
}
