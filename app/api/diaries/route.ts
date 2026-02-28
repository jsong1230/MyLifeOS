import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { getToday } from '@/lib/date-utils'
import type { DiaryEntry, EmotionType } from '@/types/diary'

// 유효한 감정 태그 목록
const VALID_EMOTION_TYPES: EmotionType[] = [
  'happy', 'sad', 'angry', 'anxious', 'excited',
  'calm', 'tired', 'lonely', 'grateful', 'proud',
]

// GET /api/diaries?date=YYYY-MM-DD — 특정 날짜 일기 조회
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  // 날짜 파라미터 검증
  if (!date) {
    return apiError('VALIDATION_ERROR')
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError('VALIDATION_ERROR')
  }

  // 특정 날짜 일기 조회 (.maybeSingle() 사용 — 없으면 null)
  const { data, error } = await supabase
    .from('diaries')
    .select('id, user_id, date, content_encrypted, emotion_tags, created_at, updated_at')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as DiaryEntry | null })
}

// POST /api/diaries — 일기 생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  let body: { content_encrypted?: unknown; emotion_tags?: unknown; date?: unknown }
  try {
    body = await request.json() as { content_encrypted?: unknown; emotion_tags?: unknown; date?: unknown }
  } catch {
    return apiError('VALIDATION_ERROR')
  }

  // 암호화된 콘텐츠 검증
  if (!body.content_encrypted || typeof body.content_encrypted !== 'string' || body.content_encrypted.trim() === '') {
    return apiError('VALIDATION_ERROR')
  }

  // 감정 태그 검증
  if (!Array.isArray(body.emotion_tags) || body.emotion_tags.length === 0) {
    return apiError('VALIDATION_ERROR')
  }

  const emotionTags = body.emotion_tags as EmotionType[]
  const invalidTags = emotionTags.filter((tag) => !VALID_EMOTION_TYPES.includes(tag))
  if (invalidTags.length > 0) {
    return apiError('VALIDATION_ERROR')
  }

  // 날짜 처리 (기본값: 오늘)
  const today = getToday()
  const date = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
    ? body.date
    : today

  // 같은 날짜에 이미 일기가 있으면 409 에러
  const { data: existing } = await supabase
    .from('diaries')
    .select('id')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle()

  if (existing) {
    return apiError('CONFLICT')
  }

  // 일기 생성
  const { data, error } = await supabase
    .from('diaries')
    .insert({
      user_id: userId,
      date,
      content_encrypted: body.content_encrypted.trim(),
      emotion_tags: emotionTags,
    })
    .select('id, user_id, date, content_encrypted, emotion_tags, created_at, updated_at')
    .maybeSingle()

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as DiaryEntry }, { status: 201 })
}

// DELETE /api/diaries?date=YYYY-MM-DD — 특정 날짜 일기 삭제 (복호화 실패 복구용)
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return apiError('AUTH_REQUIRED')
  const userId = user.id

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return apiError('VALIDATION_ERROR')
  }

  const { error } = await supabase
    .from('diaries')
    .delete()
    .eq('user_id', userId)
    .eq('date', date)

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true })
}
