import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
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
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return apiError('AUTH_REQUIRED')
  }
  const supabase = await createClient()

  const { id } = await params

  if (!id) {
    return apiError('VALIDATION_ERROR')
  }

  let body: UpdateRelationBody
  try {
    body = await request.json() as UpdateRelationBody
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 이름이 있으면 빈 문자열 방지
  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.trim() === '')) {
    return apiError('VALIDATION_ERROR')
  }

  // 관계 유형 검증 (있는 경우)
  if (body.relationship_type !== undefined) {
    if (!VALID_RELATIONSHIP_TYPES.includes(
      body.relationship_type as (typeof VALID_RELATIONSHIP_TYPES)[number]
    )) {
      return apiError('VALIDATION_ERROR')
    }
  }

  // 날짜 형식 검증 (입력된 경우)
  if (body.last_met_at != null && body.last_met_at !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.last_met_at)) {
      return apiError('VALIDATION_ERROR')
    }
  }

  // 소유자 확인
  const { data: existing } = await supabase
    .from('relations')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
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
    .eq('user_id', userId)
    .select('id, user_id, name, relationship_type, last_met_at, memo_encrypted, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as Relation })
}

// DELETE /api/relations/[id] — 인간관계 삭제 (소유자 확인)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return apiError('AUTH_REQUIRED')
  }
  const supabase = await createClient()

  const { id } = await params

  if (!id) {
    return apiError('VALIDATION_ERROR')
  }

  // 소유자 확인
  const { data: existing } = await supabase
    .from('relations')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  const { error } = await supabase
    .from('relations')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
