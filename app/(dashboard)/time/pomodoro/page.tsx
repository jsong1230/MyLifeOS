'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { getToday } from '@/lib/date-utils'
import { PomodoroTimer } from '@/components/time/pomodoro-timer'
import { Skeleton } from '@/components/ui/skeleton'

const PomodoroStats = dynamic(
  () => import('@/components/time/pomodoro-stats').then((m) => ({ default: m.PomodoroStats })),
  { ssr: false, loading: () => <Skeleton className="h-64 rounded-xl" /> }
)

// 포모도로 타이머 페이지
export default function PomodoroPage() {
  const t = useTranslations('pomodoro')
  const today = getToday()

  return (
    <div className="p-4">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-lg font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{today}</p>
      </div>

      {/* 포모도로 타이머 컴포넌트 */}
      <PomodoroTimer />

      {/* 구분선 */}
      <hr className="my-6 border-border" />

      {/* 포모도로 통계 */}
      <PomodoroStats />
    </div>
  )
}
