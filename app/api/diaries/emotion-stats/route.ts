import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { EmotionType } from '@/types/diary'

// 감정 통계 응답 타입
export interface EmotionStatsData {
  emotion_counts: Partial<Record<EmotionType, number>>
  weekday_map: Record<string, EmotionType[]>  // 0=일 ~ 6=토
  top3: EmotionType[]
}

// GET /api/diaries/emotion-stats?year=YYYY&month=MM — 월별 감정 통계
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

  // 파라미터 검증
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
  const startDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-01`
  const lastDay = new Date(yearNum, monthNum, 0).getDate()
  const endDate = `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // 해당 월 일기 목록 조회 (date, emotion_tags만 필요)
  const { data, error } = await supabase
    .from('diaries')
    .select('date, emotion_tags')
    .eq('user_id', user.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    return NextResponse.json(
      { success: false, error: '감정 통계 조회에 실패했습니다' },
      { status: 500 }
    )
  }

  const diaries = data as Array<{ date: string; emotion_tags: EmotionType[] }>

  // 감정별 등장 횟수 집계
  const emotionCounts: Partial<Record<EmotionType, number>> = {}
  // 요일별 감정 목록 (0=일 ~ 6=토)
  const weekdayMap: Record<string, EmotionType[]> = {
    '0': [], '1': [], '2': [], '3': [], '4': [], '5': [], '6': [],
  }

  for (const diary of diaries) {
    // 날짜에서 요일 계산 (Date 파싱 시 UTC 기준으로 처리)
    const [y, m, d] = diary.date.split('-').map(Number)
    const weekday = new Date(y, m - 1, d).getDay()  // 0=일 ~ 6=토

    for (const emotion of diary.emotion_tags) {
      // 감정 횟수 누적
      emotionCounts[emotion] = (emotionCounts[emotion] ?? 0) + 1
      // 요일 맵에 감정 추가
      weekdayMap[String(weekday)].push(emotion)
    }
  }

  // TOP 3 감정 계산 (횟수 내림차순, 동점이면 알파벳순)
  const top3 = (Object.entries(emotionCounts) as Array<[EmotionType, number]>)
    .sort(([a, countA], [b, countB]) => {
      if (countB !== countA) return countB - countA
      return a.localeCompare(b)
    })
    .slice(0, 3)
    .map(([emotion]) => emotion)

  const responseData: EmotionStatsData = {
    emotion_counts: emotionCounts,
    weekday_map: weekdayMap,
    top3,
  }

  return NextResponse.json({ success: true, data: responseData })
}
