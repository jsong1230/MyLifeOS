import { NextResponse, type NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
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
  const { data: { session } } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!userId) return apiError('AUTH_REQUIRED')

  const { searchParams } = new URL(request.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  // 년도 및 월 파라미터 검증
  if (!year || !month) {
    return apiError('VALIDATION_ERROR')
  }

  const yearNum = parseInt(year, 10)
  const monthNum = parseInt(month, 10)

  if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return apiError('VALIDATION_ERROR')
  }

  // 해당 월의 시작일/종료일 계산
  const startDate = `${year}-${String(monthNum).padStart(2, '0')}-01`
  const lastDay = new Date(yearNum, monthNum, 0).getDate()
  const endDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // id, date, emotion_tags만 조회 (content_encrypted 제외)
  const { data, error } = await supabase
    .from('diaries')
    .select('id, date, emotion_tags')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    return apiError('SERVER_ERROR')
  }

  return NextResponse.json({ success: true, data: data as DiaryListItem[] })
}
