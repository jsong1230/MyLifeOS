import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { Category, CategoryType, UpdateCategoryInput } from '@/types/category'

const VALID_TYPES: CategoryType[] = ['income', 'expense', 'both']

// PATCH /api/categories/[id] — 카테고리 수정
// 시스템 카테고리 수정 시도 시 403 반환
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  const { id } = await params

  if (!id) {
    return apiError('VALIDATION_ERROR')
  }

  // 해당 카테고리 조회
  const { data: existing } = await supabase
    .from('categories')
    .select('id, user_id, is_system')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  // 시스템 카테고리 수정 금지
  if (existing.is_system) {
    return apiError('FORBIDDEN')
  }

  // 본인 소유 확인
  if (existing.user_id !== user.id) {
    return apiError('NOT_FOUND')
  }

  let body: UpdateCategoryInput
  try {
    body = await request.json() as UpdateCategoryInput
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 이름이 주어진 경우 빈 값 방지
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      return apiError('VALIDATION_ERROR')
    }
  }

  // type 유효성 검증
  if (body.type !== undefined && !VALID_TYPES.includes(body.type)) {
    return apiError('VALIDATION_ERROR')
  }

  // color HEX 형식 검증 (null 허용)
  if (body.color !== undefined && body.color !== null && !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
    return apiError('VALIDATION_ERROR')
  }

  // sort_order 숫자 검증
  if (body.sort_order !== undefined && (typeof body.sort_order !== 'number' || !Number.isInteger(body.sort_order))) {
    return apiError('VALIDATION_ERROR')
  }

  // 업데이트 데이터 구성 (undefined 필드 제외)
  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name.trim()
  if (body.icon !== undefined) updateData.icon = body.icon
  if (body.color !== undefined) updateData.color = body.color
  if (body.type !== undefined) updateData.type = body.type
  if (body.sort_order !== undefined) updateData.sort_order = body.sort_order

  if (Object.keys(updateData).length === 0) {
    return apiError('VALIDATION_ERROR')
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, name, icon, color, type, is_system, sort_order, created_at')
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as Category })
}

// DELETE /api/categories/[id] — 카테고리 삭제
// 시스템 카테고리 삭제 시도 시 403, 사용 중이면 409 반환
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError('AUTH_REQUIRED')
  }

  const { id } = await params

  if (!id) {
    return apiError('VALIDATION_ERROR')
  }

  // 해당 카테고리 조회
  const { data: existing } = await supabase
    .from('categories')
    .select('id, user_id, is_system, name')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  // 시스템 카테고리 삭제 금지
  if (existing.is_system) {
    return apiError('FORBIDDEN')
  }

  // 본인 소유 확인
  if (existing.user_id !== user.id) {
    return apiError('NOT_FOUND')
  }

  // transactions 테이블에서 사용 여부 확인 (삭제 전 경고용)
  const { count, error: countError } = await supabase
    .from('transactions')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)
    .eq('user_id', user.id)

  if (countError) {
    // transactions 테이블이 아직 없는 경우 무시하고 진행
    if (!countError.message.includes('does not exist')) {
      return apiError('SERVER_ERROR')
    }
  }

  // 사용 중인 카테고리 삭제 시 409 Conflict
  if (count !== null && count > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `이 카테고리는 ${count}개의 거래에서 사용 중입니다. 삭제하면 해당 거래의 카테고리가 해제됩니다.`,
        data: { usageCount: count },
      },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
