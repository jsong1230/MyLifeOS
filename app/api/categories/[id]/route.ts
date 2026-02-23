import { NextResponse, type NextRequest } from 'next/server'
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
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다' },
      { status: 401 }
    )
  }

  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 ID입니다' },
      { status: 400 }
    )
  }

  // 해당 카테고리 조회
  const { data: existing } = await supabase
    .from('categories')
    .select('id, user_id, is_system')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '카테고리를 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  // 시스템 카테고리 수정 금지
  if (existing.is_system) {
    return NextResponse.json(
      { success: false, error: '시스템 카테고리는 수정할 수 없습니다' },
      { status: 403 }
    )
  }

  // 본인 소유 확인
  if (existing.user_id !== user.id) {
    return NextResponse.json(
      { success: false, error: '카테고리를 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  let body: UpdateCategoryInput
  try {
    body = await request.json() as UpdateCategoryInput
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 이름이 주어진 경우 빈 값 방지
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim() === '') {
      return NextResponse.json(
        { success: false, error: '카테고리 이름은 비워둘 수 없습니다' },
        { status: 400 }
      )
    }
  }

  // type 유효성 검증
  if (body.type !== undefined && !VALID_TYPES.includes(body.type)) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 카테고리 타입입니다' },
      { status: 400 }
    )
  }

  // color HEX 형식 검증 (null 허용)
  if (body.color !== undefined && body.color !== null && !/^#[0-9A-Fa-f]{6}$/.test(body.color)) {
    return NextResponse.json(
      { success: false, error: '색상은 #RRGGBB 형식이어야 합니다' },
      { status: 400 }
    )
  }

  // sort_order 숫자 검증
  if (body.sort_order !== undefined && (typeof body.sort_order !== 'number' || !Number.isInteger(body.sort_order))) {
    return NextResponse.json(
      { success: false, error: '정렬 순서는 정수여야 합니다' },
      { status: 400 }
    )
  }

  // 업데이트 데이터 구성 (undefined 필드 제외)
  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name.trim()
  if (body.icon !== undefined) updateData.icon = body.icon
  if (body.color !== undefined) updateData.color = body.color
  if (body.type !== undefined) updateData.type = body.type
  if (body.sort_order !== undefined) updateData.sort_order = body.sort_order

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { success: false, error: '수정할 내용이 없습니다' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, name, icon, color, type, is_system, sort_order, created_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '카테고리 수정에 실패했습니다' },
      { status: 500 }
    )
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
    return NextResponse.json(
      { success: false, error: '인증이 필요합니다' },
      { status: 401 }
    )
  }

  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 ID입니다' },
      { status: 400 }
    )
  }

  // 해당 카테고리 조회
  const { data: existing } = await supabase
    .from('categories')
    .select('id, user_id, is_system, name')
    .eq('id', id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '카테고리를 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  // 시스템 카테고리 삭제 금지
  if (existing.is_system) {
    return NextResponse.json(
      { success: false, error: '시스템 카테고리는 삭제할 수 없습니다' },
      { status: 403 }
    )
  }

  // 본인 소유 확인
  if (existing.user_id !== user.id) {
    return NextResponse.json(
      { success: false, error: '카테고리를 찾을 수 없습니다' },
      { status: 404 }
    )
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
      return NextResponse.json(
        { success: false, error: '카테고리 사용 여부 확인에 실패했습니다' },
        { status: 500 }
      )
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
    return NextResponse.json(
      { success: false, error: '카테고리 삭제에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: null })
}
