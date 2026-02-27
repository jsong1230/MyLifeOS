import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { Category, CategoryType, CreateCategoryInput } from '@/types/category'

const VALID_TYPES: CategoryType[] = ['income', 'expense', 'both']

// GET /api/categories — 카테고리 목록 조회 (시스템 + 사용자 카테고리)
// 쿼리 파라미터: type=expense|income|both (미지정 시 전체)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { searchParams } = new URL(request.url)
  const typeParam = searchParams.get('type') as CategoryType | null

  // type 파라미터 유효성 검증
  if (typeParam !== null && !VALID_TYPES.includes(typeParam)) {
    return apiError('VALIDATION_ERROR')
  }

  // RLS 정책에 의해 시스템 카테고리(is_system=TRUE) + 본인 카테고리만 조회됨
  let query = supabase
    .from('categories')
    .select('id, user_id, name, name_key, icon, color, type, is_system, sort_order, created_at')
    .or(`is_system.eq.true,user_id.eq.${userId}`)
    .order('sort_order', { ascending: true })

  // type 필터 적용
  if (typeParam) {
    query = query.eq('type', typeParam)
  }

  const { data, error } = await query

  if (error) {
    return apiError('SERVER_ERROR')
  }

  // 마이그레이션 중복 실행 등으로 같은 이름+타입 카테고리가 중복될 경우 방어
  const seen = new Set<string>()
  const uniqueData = (data ?? []).filter((cat) => {
    const key = `${cat.name}:${cat.type}:${String(cat.is_system)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }) as Category[]

  return NextResponse.json({ success: true, data: uniqueData })
}

// POST /api/categories — 커스텀 카테고리 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: CreateCategoryInput
  try {
    body = await request.json() as CreateCategoryInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 이름 필수 검증
  if (!body.name || typeof body.name !== 'string' || body.name.trim() === '') {
    return apiError('VALIDATION_ERROR')
  }

  // type 필수 검증
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    return apiError('VALIDATION_ERROR')
  }

  // color HEX 형식 검증 (선택값)
  if (body.color && !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
    return apiError('VALIDATION_ERROR')
  }

  // 현재 사용자의 최대 sort_order 조회 (시스템 제외)
  const { data: maxOrderData } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextSortOrder = maxOrderData ? maxOrderData.sort_order + 10 : 100

  const insertData = {
    user_id: userId,
    name: body.name.trim(),
    icon: body.icon ?? null,
    color: body.color ?? null,
    type: body.type,
    is_system: false,
    sort_order: nextSortOrder,
  }

  const { data, error } = await supabase
    .from('categories')
    .insert(insertData)
    .select('id, user_id, name, name_key, icon, color, type, is_system, sort_order, created_at')
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as Category }, { status: 201 })
}
