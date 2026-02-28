import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import { createClient } from '@/lib/supabase/server'
import { formatDateToString } from '@/lib/date-utils'
import type { EmotionType } from '@/types/diary'

// 검색용 일기 응답 타입 (content_encrypted 포함)
export interface DiarySearchItem {
  id: string
  date: string
  content_encrypted: string
  emotion_tags: EmotionType[]
}

// GET /api/diaries/search?months=N — 최근 N개월 일기 전체 조회 (검색용)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const monthsParam = searchParams.get('months')

  // months 파라미터 파싱 (기본값 12, 최대 60)
  const months = monthsParam ? parseInt(monthsParam, 10) : 12
  if (isNaN(months) || months < 1 || months > 60) {
    return apiError('VALIDATION_ERROR')
  }

  // N개월 전 시작일 계산
  const now = new Date()
  const startDate = new Date(now)
  startDate.setMonth(startDate.getMonth() - months)
  const startDateStr = formatDateToString(startDate)

  // 오늘 날짜
  const todayStr = formatDateToString(now)

  // content_encrypted 포함하여 전체 조회, 날짜 내림차순 정렬
  const { data, error } = await supabase
    .from('diaries')
    .select('id, date, content_encrypted, emotion_tags')
    .eq('user_id', userId)
    .gte('date', startDateStr)
    .lte('date', todayStr)
    .order('date', { ascending: false })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as DiarySearchItem[] })
}
