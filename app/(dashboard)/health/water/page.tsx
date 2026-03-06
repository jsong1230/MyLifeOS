'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getToday, formatDateToString } from '@/lib/date-utils'
import { Button } from '@/components/ui/button'
import { WaterTracker } from '@/components/health/water-tracker'

// 날짜를 하루 앞뒤로 이동하는 헬퍼
function shiftDate(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return formatDateToString(d)
}

// 날짜 표시 포맷 (YYYY-MM-DD → 사람이 읽기 쉬운 형식)
function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// 수분 섭취 페이지 — 날짜 선택 + WaterTracker 렌더링
export default function WaterPage() {
  const t = useTranslations('health.water')
  const [selectedDate, setSelectedDate] = useState<string>(getToday())
  const today = getToday()
  const isToday = selectedDate === today

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('daily_goal')}: 2,000ml
        </p>
      </div>

      {/* 날짜 선택 네비게이터 */}
      <div className="flex items-center justify-between gap-3 bg-muted/50 rounded-lg p-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
          aria-label="이전 날"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-medium">{formatDisplayDate(selectedDate)}</span>
          {isToday && (
            <span className="text-xs text-primary font-medium">{t('today_label')}</span>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
          disabled={isToday}
          aria-label="다음 날"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 수분 트래커 */}
      <WaterTracker date={selectedDate} />
    </div>
  )
}
