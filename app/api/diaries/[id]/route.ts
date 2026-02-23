import { NextResponse, type NextRequest } from 'next/server'
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

  let body: { content_encrypted?: unknown; emotion_tags?: unknown }
  try {
    body = await request.json() as { content_encrypted?: unknown; emotion_tags?: unknown }
  } catch {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 형식입니다' },
      { status: 400 }
    )
  }

  // content_encrypted 검증 (선택 입력 필드이지만, 있을 경우 유효해야 함)
  if (body.content_encrypted !== undefined) {
    if (typeof body.content_encrypted !== 'string' || body.content_encrypted.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'content_encrypted는 비워둘 수 없습니다' },
        { status: 400 }
      )
    }
  }

  // emotion_tags 검증 (선택 입력 필드이지만, 있을 경우 유효해야 함)
  if (body.emotion_tags !== undefined) {
    if (!Array.isArray(body.emotion_tags) || body.emotion_tags.length === 0) {
      return NextResponse.json(
        { success: false, error: '감정 태그를 1개 이상 선택해야 합니다' },
        { status: 400 }
      )
    }

    const emotionTags = body.emotion_tags as EmotionType[]
    const invalidTags = emotionTags.filter((tag) => !VALID_EMOTION_TYPES.includes(tag))
    if (invalidTags.length > 0) {
      return NextResponse.json(
        { success: false, error: `유효하지 않은 감정 태그: ${invalidTags.join(', ')}` },
        { status: 400 }
      )
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
    return NextResponse.json(
      { success: false, error: '일기를 찾을 수 없습니다' },
      { status: 404 }
    )
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
    return NextResponse.json(
      { success: false, error: '일기 수정에 실패했습니다' },
      { status: 500 }
    )
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

  // 해당 일기가 현재 사용자 소유인지 확인
  const { data: existing } = await supabase
    .from('diaries')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: '일기를 찾을 수 없습니다' },
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from('diaries')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return NextResponse.json(
      { success: false, error: '일기 삭제에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
