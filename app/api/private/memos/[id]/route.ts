import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { QuickMemo } from '@/types/memo'

const VALID_COLORS = ['default', 'yellow', 'green', 'blue', 'pink', 'purple'] as const

// PATCH 요청 바디 타입
interface UpdateMemoBody {
  content_encrypted?: string
  is_pinned?: boolean
  color?: string
}

// PATCH /api/private/memos/[id] — 퀵 메모 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { id } = await params
  if (!id) return apiError('VALIDATION_ERROR')

  let body: UpdateMemoBody
  try {
    body = await request.json() as UpdateMemoBody
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // content_encrypted 있으면 빈 문자열 방지
  if (body.content_encrypted !== undefined && (typeof body.content_encrypted !== 'string' || body.content_encrypted.trim() === '')) {
    return apiError('VALIDATION_ERROR')
  }

  // color 검증 (있는 경우)
  if (body.color !== undefined && !VALID_COLORS.includes(body.color as (typeof VALID_COLORS)[number])) {
    return apiError('VALIDATION_ERROR')
  }

  // 소유자 확인
  const { data: existing } = await supabase
    .from('quick_memos')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) return apiError('NOT_FOUND')

  // 업데이트 데이터 빌드
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.content_encrypted !== undefined) {
    updateData.content_encrypted = body.content_encrypted
  }
  if (body.is_pinned !== undefined) {
    updateData.is_pinned = body.is_pinned
  }
  if (body.color !== undefined) {
    updateData.color = body.color
  }

  const { data, error } = await supabase
    .from('quick_memos')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, content_encrypted, is_pinned, color, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as QuickMemo })
}

// DELETE /api/private/memos/[id] — 퀵 메모 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')

  const { id } = await params
  if (!id) return apiError('VALIDATION_ERROR')

  // 소유자 확인
  const { data: existing } = await supabase
    .from('quick_memos')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) return apiError('NOT_FOUND')

  const { error } = await supabase
    .from('quick_memos')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: null })
}
