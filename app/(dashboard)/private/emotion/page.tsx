'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2, BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmotionCalendar } from '@/components/private/emotion-calendar'
import { useDiaryList } from '@/hooks/use-diaries'
import { EMOTION_LABELS, EMOTION_ICONS, type EmotionType } from '@/types/diary'

// 감정 타입 목록 (분포 요약 표시 순서)
const EMOTION_LIST: EmotionType[] = [
  'happy', 'sad', 'angry', 'anxious', 'excited',
  'calm', 'tired', 'lonely', 'grateful', 'proud',
]

// 현재 연월 반환 헬퍼
function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

// 연/월 포맷 (한국어 표기)
function formatYearMonth(year: number, month: number): string {
  return `${year}년 ${month}월`
}

// 월을 N개월 이동한 연/월 반환
function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

// 감정 캘린더 페이지 — 월간 캘린더 + 감정 분포 요약
export default function EmotionPage() {
  const { year: initYear, month: initMonth } = getCurrentYearMonth()
  const [year, setYear] = useState(initYear)
  const [month, setMonth] = useState(initMonth)

  // 월별 일기 목록 조회 (감정 태그만 포함)
  const { data: diaries, isLoading, error } = useDiaryList(year, month)

  // 이번 달 감정 분포 계산 (각 감정별 등장 횟수)
  function calcEmotionCounts(): Map<EmotionType, number> {
    const counts = new Map<EmotionType, number>()
    if (!diaries) return counts
    for (const diary of diaries) {
      for (const emotion of diary.emotion_tags) {
        counts.set(emotion, (counts.get(emotion) ?? 0) + 1)
      }
    }
    return counts
  }

  const emotionCounts = calcEmotionCounts()
  // 이번 달에 등장한 감정만 필터링, 횟수 내림차순 정렬
  const presentEmotions = EMOTION_LIST.filter((e) => (emotionCounts.get(e) ?? 0) > 0)
  const totalEntries = diaries?.length ?? 0

  // 이전 달로 이동
  function goPrevMonth() {
    const { year: y, month: m } = shiftMonth(year, month, -1)
    setYear(y)
    setMonth(m)
  }

  // 다음 달로 이동 (현재 달 이후 이동 불가)
  function goNextMonth() {
    const { year: nextY, month: nextM } = shiftMonth(year, month, 1)
    // 미래 달 방지
    const { year: curY, month: curM } = getCurrentYearMonth()
    if (nextY > curY || (nextY === curY && nextM > curM)) return
    setYear(nextY)
    setMonth(nextM)
  }

  const { year: curY, month: curM } = getCurrentYearMonth()
  const isCurrentMonth = year === curY && month === curM

  return (
    <div className="flex flex-col h-full">
      {/* 월간 탐색 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={goPrevMonth}
          aria-label="이전 달"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <span className="text-sm font-semibold">
          {formatYearMonth(year, month)}
        </span>

        <div className="flex items-center gap-1">
          {/* 통계 페이지 이동 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="감정 통계 보기"
          >
            <Link href="/private/emotion/stats">
              <BarChart2 className="h-5 w-5" />
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={goNextMonth}
            disabled={isCurrentMonth}
            aria-label="다음 달"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-auto p-4 space-y-6">
        {/* 로딩 상태 */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* 에러 상태 */}
        {!isLoading && error && (
          <div className="flex items-center justify-center min-h-[300px]">
            <p className="text-sm text-destructive" role="alert">
              {error.message}
            </p>
          </div>
        )}

        {/* 정상 렌더링 */}
        {!isLoading && !error && (
          <>
            {/* 월간 감정 캘린더 */}
            <EmotionCalendar
              year={year}
              month={month}
              diaries={diaries ?? []}
            />

            {/* 이번 달 감정 분포 요약 */}
            <section aria-label="이번 달 감정 분포">
              <h2 className="text-sm font-semibold text-foreground mb-3">
                이번 달 감정 분포
              </h2>

              {totalEntries === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  아직 이번 달 기록이 없습니다
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {presentEmotions.length > 0 ? (
                    presentEmotions.map((emotion) => {
                      const count = emotionCounts.get(emotion) ?? 0
                      return (
                        <div
                          key={emotion}
                          className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2"
                        >
                          <span className="text-xl leading-none" aria-hidden="true">
                            {EMOTION_ICONS[emotion]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-foreground truncate">
                              {EMOTION_LABELS[emotion]}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {count}회
                            </p>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="col-span-full text-sm text-muted-foreground text-center py-4">
                      감정 태그가 기록된 일기가 없습니다
                    </p>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
