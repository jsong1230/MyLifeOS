'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { EmotionTop3 } from '@/components/private/emotion-top3'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const EmotionPieChart = dynamic(
  () => import('@/components/private/emotion-pie-chart').then((m) => ({ default: m.EmotionPieChart })),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-xl" /> }
)
import { EmotionHeatmap } from '@/components/private/emotion-heatmap'
import { useEmotionStats } from '@/hooks/use-emotion-stats'

// 현재 연월 반환 헬퍼
function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

// 연/월 포맷 (locale 기반)
function formatYearMonth(year: number, month: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    new Date(year, month - 1, 1)
  )
}

// 월을 N개월 이동한 연/월 반환
function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1)
  return { year: date.getFullYear(), month: date.getMonth() + 1 }
}

// 감정 통계 페이지 — 월별 감정 분포 + 요일 패턴 + TOP 3
export default function EmotionStatsPage() {
  const t = useTranslations()
  const locale = useLocale()
  const { year: initYear, month: initMonth } = getCurrentYearMonth()
  const [year, setYear] = useState(initYear)
  const [month, setMonth] = useState(initMonth)

  // 감정 통계 조회
  const { data: stats, isLoading, error } = useEmotionStats(year, month)

  // 이전 달로 이동
  function goPrevMonth() {
    const { year: y, month: m } = shiftMonth(year, month, -1)
    setYear(y)
    setMonth(m)
  }

  // 다음 달로 이동 (현재 달 이후 이동 불가)
  function goNextMonth() {
    const { year: nextY, month: nextM } = shiftMonth(year, month, 1)
    const { year: curY, month: curM } = getCurrentYearMonth()
    if (nextY > curY || (nextY === curY && nextM > curM)) return
    setYear(nextY)
    setMonth(nextM)
  }

  const { year: curY, month: curM } = getCurrentYearMonth()
  const isCurrentMonth = year === curY && month === curM

  return (
    <div className="flex flex-col h-full">
      {/* 헤더: 뒤로가기 + 월 탐색 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
        {/* 뒤로가기 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label={t('private.emotion.backToCalendar')}
        >
          <Link href="/private/emotion">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        {/* 월 탐색 */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goPrevMonth}
            aria-label={t('private.emotion.prevMonth')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <span className="text-sm font-semibold min-w-[100px] text-center">
            {formatYearMonth(year, month, locale)}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={goNextMonth}
            disabled={isCurrentMonth}
            aria-label={t('private.emotion.nextMonth')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* 헤더 우측 여백 균형용 빈 공간 */}
        <div className="w-9" />
      </div>

      {/* 페이지 타이틀 */}
      <div className="px-4 pt-4 pb-1">
        <h1 className="text-base font-bold text-foreground">{t('private.emotions.statistics')}</h1>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-8">
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
        {!isLoading && !error && stats && (
          <>
            {/* AC-03: TOP 3 감정 하이라이트 */}
            <EmotionTop3 stats={stats} />

            {/* AC-01: 월별 감정 분포 도넛 차트 */}
            <EmotionPieChart stats={stats} />

            {/* AC-02: 요일별 감정 패턴 히트맵 */}
            <EmotionHeatmap year={year} month={month} stats={stats} />
          </>
        )}
      </div>
    </div>
  )
}
