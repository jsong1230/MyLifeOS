import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Relation } from '@/types/relation'

const VALID_RELATIONSHIP_TYPES = ['family', 'friend', 'colleague', 'other'] as const

// PATCH 요청 바디 타입 — 클라이언트가 암호화 후 전송하는 형식
interface UpdateRelationBody {
  name?: string
  relationship_type?: string
  last_met_at?: string | null
  memo_encrypted?: string | null
}

// PATCH /api/relations/[id] — 인간관계 수정 (소유자 확인)
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

  let body: UpdateRelationBody
  try {
    body = await request.json() as UpdateRelationBody
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // 이름이 있으면 빈 문자열 방지
  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
    return NextResponse.json(
      { success: false, error: '이름은 비워둘 수 없습니다' },
      { status: 400 }
    )
  }

  // 관계 유형 검증 (있는 경우)
  if (body.relationship_type !== undefined) {
    if (!VALID_RELATIONSHIP_TYPES.includes(
      body.relationship_type as (typeof VALID_RELATIONSHIP_TYPES)[number]
    )) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 관계 유형입니다' },
        { status: 400 }
      )
    }
  }

  // 날짜 형식 검증 (입력된 경우)
  if (body.last_met_at != null && body.last_met_at !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.last_met_at)) {
      return NextResponse.json(
        { success: false, error: '날짜 형식이 올바르지 않습니다 (YYYY-MM-DD)' },
        { status: 400 }
      )
    }
  }

  // 소유자 확인
  const { data: existing } = await supabase
    .from('relations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '인간관계 항목을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  // 업데이트 데이터 빌드
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.name !== undefined) {
    updateData.name = body.name.trim()
  }
  if (body.relationship_type !== undefined) {
    updateData.relationship_type = body.relationship_type
  }
  if ('last_met_at' in body) {
    updateData.last_met_at = body.last_met_at ?? null
  }
  if ('memo_encrypted' in body) {
    updateData.memo_encrypted = body.memo_encrypted ?? null
  }

  const { data, error } = await supabase
    .from('relations')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, name, relationship_type, last_met_at, memo_encrypted, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return NextResponse.json(
      { success: false, error: '인간관계 수정에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as Relation })
}

// DELETE /api/relations/[id] — 인간관계 삭제 (소유자 확인)
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

  // 소유자 확인
  const { data: existing } = await supabase
    .from('relations')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '인간관계 항목을 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from('relations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { success: false, error: '인간관계 삭제에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: null })
}
