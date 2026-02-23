import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

  const { searchParams } = new URL(request.url)
  const monthsParam = searchParams.get('months')

  // months 파라미터 파싱 (기본값 12, 최대 60)
  const months = monthsParam ? parseInt(monthsParam, 10) : 12
  if (isNaN(months) || months < 1 || months > 60) {
    return NextResponse.json(
      { success: false, error: 'months 파라미터는 1~60 사이의 정수여야 합니다' },
      { status: 400 }
    )
  }

  // N개월 전 시작일 계산
  const now = new Date()
  const startDate = new Date(now)
  startDate.setMonth(startDate.getMonth() - months)
  const startDateStr = startDate.toISOString().split('T')[0]

  // 오늘 날짜
  const todayStr = now.toISOString().split('T')[0]

  // content_encrypted 포함하여 전체 조회, 날짜 내림차순 정렬
  const { data, error } = await supabase
    .from('diaries')
    .select('id, date, content_encrypted, emotion_tags')
    .eq('user_id', user.id)
    .gte('date', startDateStr)
    .lte('date', todayStr)
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json(
      { success: false, error: '일기 검색 조회에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as DiarySearchItem[] })
}
