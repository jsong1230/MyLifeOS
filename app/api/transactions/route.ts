import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday, getMonthRange } from '@/lib/date-utils'
import { getUserDefaultCurrency } from '@/lib/user-defaults'
import type { CreateTransactionInput, Transaction } from '@/types/transaction'
import type { Database } from '@/types/database.types'

// categories 조인을 포함한 SELECT 결과를 모델링하는 DB 행 타입
// 참고: Supabase 비제네릭 클라이언트는 FK 조인을 배열로 추론하지만 many-to-one 관계이므로
// 런타임에서는 단일 객체. Transaction 타입으로의 최종 캐스트에 unknown 중간 단계 필요.
// Supabase 제네릭 클라이언트(createServerClient<Database>()) 사용 시 unknown 제거 가능.
type TransactionDbRow = Database['public']['Tables']['transactions']['Row'] & {
  category: Pick<
    Database['public']['Tables']['categories']['Row'],
    'id' | 'name' | 'name_key' | 'icon' | 'color' | 'type'
  > | null
}

// GET /api/transactions — 거래 목록 조회
// 쿼리 파라미터: month (YYYY-MM), type (income/expense), category_id, is_favorite (true)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')
  const type = searchParams.get('type')
  const categoryId = searchParams.get('category_id')
  const isFavorite = searchParams.get('is_favorite')

  // 카테고리 정보 조인하여 조회
  let query = supabase
    .from('transactions')
    .select(
      'id, user_id, amount, type, category_id, memo, date, is_favorite, currency, created_at, updated_at, category:categories(id, name, name_key, icon, color, type)'
    )
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  // 월 필터: YYYY-MM 형식으로 해당 월의 거래만 조회
  if (month) {
    const [year, monthNum] = month.split('-').map(Number)
    const { start, end } = getMonthRange(year, monthNum)
    query = query.gte('date', start).lte('date', end)
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

  return NextResponse.json({ success: true, data: (data ?? []) as unknown as Transaction[] })
}

// POST /api/transactions — 거래 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

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
    user_id: userId,
    amount: body.amount,
    type: body.type,
    category_id: body.category_id ?? null,
    memo: body.memo ?? null,
    date: body.date ?? getToday(),
    is_favorite: body.is_favorite ?? false,
    currency: body.currency ?? await getUserDefaultCurrency(supabase, userId),
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert(insertData)
    .select(
      'id, user_id, amount, type, category_id, memo, date, is_favorite, currency, created_at, updated_at, category:categories(id, name, name_key, icon, color, type)'
    )
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as unknown as Transaction }, { status: 201 })
}
