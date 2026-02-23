import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmotionType } from '@/types/diary'

// 월별 일기 목록 응답 타입 (감정 캘린더용 — 콘텐츠 제외)
interface DiaryListItem {
  id: string
  date: string
  emotion_tags: EmotionType[]
}

// GET /api/diaries/list?year=YYYY&month=MM — 월별 일기 목록 (감정 캘린더용)
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
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  // 년도 및 월 파라미터 검증
  if (!year || !month) {
    return NextResponse.json(
      { success: false, error: 'year와 month 파라미터가 필요합니다' },
      { status: 400 }
    )
  }

  const yearNum = parseInt(year, 10)
  const monthNum = parseInt(month, 10)

  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return NextResponse.json(
      { success: false, error: '유효하지 않은 year 또는 month 값입니다' },
      { status: 400 }
    )
  }

  // 해당 월의 시작일/종료일 계산
  const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`
  const lastDay = new Date(yearNum, monthNum, 0).getDate()
  const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // id, date, emotion_tags만 조회 (content_encrypted 제외)
  const { data, error } = await supabase
    .from('diaries')
    .select('id, date, emotion_tags')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    return NextResponse.json(
      { success: false, error: '일기 목록 조회에 실패했습니다' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true, data: data as DiaryListItem[] })
}
