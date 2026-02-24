import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import type { DiaryEntry, EmotionType } from '@/types/diary'

// 유효한 감정 태그 목록
const VALID_EMOTION_TYPES: EmotionType[] = [
  'happy', 'sad', 'angry', 'anxious', 'excited',
  'calm', 'tired', 'lonely', 'grateful', 'proud',
]

// PATCH /api/diaries/[id] — 일기 수정 (소유자 확인)
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

  let body: { content_encrypted?: unknown; emotion_tags?: unknown }
  try {
    body = await request.json() as { content_encrypted?: unknown; emotion_tags?: unknown }
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // content_encrypted 검증 (선택 입력 필드이지만, 있을 경우 유효해야 함)
  if (body.content_encrypted !== undefined) {
    if (typeof body.content_encrypted !== 'string' || body.content_encrypted.trim() === '') {
      return apiError('VALIDATION_ERROR')
    }
  }

  // emotion_tags 검증 (선택 입력 필드이지만, 있을 경우 유효해야 함)
  if (body.emotion_tags !== undefined) {
    if (!Array.isArray(body.emotion_tags) || body.emotion_tags.length === 0) {
      return apiError('VALIDATION_ERROR')
    }

    const emotionTags = body.emotion_tags as EmotionType[]
    const invalidTags = emotionTags.filter((tag) => !VALID_EMOTION_TYPES.includes(tag))
    if (invalidTags.length > 0) {
      return apiError('VALIDATION_ERROR')
    }
  }

  // 해당 일기가 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('diaries')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  // 업데이트할 필드 구성
  const updateData: Partial<{ content_encrypted: string; emotion_tags: EmotionType[] }> = {}
  if (body.content_encrypted !== undefined) {
    updateData.content_encrypted = (body.content_encrypted as string).trim()
  }
  if (body.emotion_tags !== undefined) {
    updateData.emotion_tags = body.emotion_tags as EmotionType[]
  }

  const { data, error } = await supabase
    .from('diaries')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id, user_id, date, content_encrypted, emotion_tags, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as DiaryEntry })
}

// DELETE /api/diaries/[id] — 일기 삭제 (소유자 확인)
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

  // 해당 일기가 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('diaries')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return apiError('NOT_FOUND')
  }

  const { error } = await supabase
    .from('diaries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true })
}
