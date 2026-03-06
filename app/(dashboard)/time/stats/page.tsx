'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useTodoWeeklyStats,
  useTodoMonthlyStats,
  useRoutineWeeklyStats,
  useRoutineMonthlyStats,
} from '@/hooks/use-completion-stats'

// recharts를 lazy load — 루틴 바 차트는 스크롤 없이는 보이지 않으므로 분리
const RoutineBarChart = dynamic(
  () => import('@/components/time/routine-bar-chart').then((m) => ({ default: m.RoutineBarChart })),
  { ssr: false, loading: () => <Skeleton className="h-[180px] w-full" /> }
)

// ──────────────────────────────────────────────
// 날짜 유틸
// ──────────────────────────────────────────────

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getCurrentWeekStart(): string {
  const today = new Date()
  const day = today.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  return toLocalDateStr(monday)
}

function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function addWeeks(weekStart: string, n: number): string {
  const date = new Date(weekStart + 'T00:00:00')
  date.setDate(date.getDate() + n * 7)
  return toLocalDateStr(date)
}

function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatWeekLabel(weekStart: string, locale: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' })
  return `${fmt.format(start)} ~ ${fmt.format(end)}`
}

function formatMonthLabel(month: string, locale: string): string {
  const [y, m] = month.split('-').map(Number)
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    new Date(y, m - 1, 1)
  )
}

// ──────────────────────────────────────────────
// 완료율 원형 게이지 (CSS 기반)
// ──────────────────────────────────────────────

function RateGauge({ rate, label }: { rate: number; label: string }) {
  const color = rate >= 80 ? '#22c55e' : rate >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: `conic-gradient(${color} ${rate * 3.6}deg, hsl(var(--muted)) 0deg)`,
        }}
      >
        <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
          <span className="text-lg font-bold">{rate}%</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

// ──────────────────────────────────────────────
// 완료율 통계 페이지
// ──────────────────────────────────────────────

type TabType = 'weekly' | 'monthly'

export default function StatsPage() {
  const locale = useLocale()
  const t = useTranslations('time.stats')
  const tc = useTranslations('common')
  const [tab, setTab] = useState<TabType>('weekly')
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart)
  const [month, setMonth] = useState(getCurrentMonth)

  const isCurrentWeek = weekStart === getCurrentWeekStart()
  const isCurrentMonth = month === getCurrentMonth()

  // 주간 데이터
  const todoWeekly = useTodoWeeklyStats(tab === 'weekly' ? weekStart : '')
  const routineWeekly = useRoutineWeeklyStats(tab === 'weekly' ? weekStart : '')

  // 월간 데이터
  const todoMonthly = useTodoMonthlyStats(tab === 'monthly' ? month : '')
  const routineMonthly = useRoutineMonthlyStats(tab === 'monthly' ? month : '')

  const todoData = tab === 'weekly' ? todoWeekly.data : todoMonthly.data
  const routineData = tab === 'weekly' ? routineWeekly.data : routineMonthly.data
  const isLoading =
    tab === 'weekly'
      ? todoWeekly.isLoading || routineWeekly.isLoading
      : todoMonthly.isLoading || routineMonthly.isLoading

  const achievementRateLabel = t('achievementRate')

  // 루틴별 차트 데이터
  const routineChartData = (routineData?.per_routine ?? []).map((r) => ({
    name: r.routine_name.length > 6 ? r.routine_name.slice(0, 6) + '…' : r.routine_name,
    [achievementRateLabel]: r.rate,
  }))

  return (
    <div className="p-4 max-w-lg mx-auto space-y-4">
      {/* 탭 전환 */}
      <div className="flex bg-muted rounded-lg p-1">
        <button
          type="button"
          onClick={() => setTab('weekly')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'weekly'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('weekly')}
        </button>
        <button
          type="button"
          onClick={() => setTab('monthly')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'monthly'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('monthly')}
        </button>
      </div>

      {/* 기간 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            tab === 'weekly'
              ? setWeekStart((w) => addWeeks(w, -1))
              : setMonth((m) => addMonths(m, -1))
          }
          aria-label={tc('prev')}
        >
          &lt;
        </Button>
        <div className="text-center">
          <p className="text-sm font-semibold">
            {tab === 'weekly' ? formatWeekLabel(weekStart, locale) : formatMonthLabel(month, locale)}
          </p>
          {(tab === 'weekly' ? isCurrentWeek : isCurrentMonth) && (
            <p className="text-xs text-primary">{tab === 'weekly' ? tc('thisWeek') : t('thisMonth')}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            tab === 'weekly'
              ? setWeekStart((w) => addWeeks(w, 1))
              : setMonth((m) => addMonths(m, 1))
          }
          disabled={tab === 'weekly' ? isCurrentWeek : isCurrentMonth}
          aria-label={tc('next')}
        >
          &gt;
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">{tc('loading')}</p>
        </div>
      ) : (
        <>
          {/* 완료율 게이지 카드 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{t('completionSummary')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-around py-2">
                <div className="flex flex-col items-center gap-1">
                  <RateGauge rate={todoData?.rate ?? 0} label={t('todoCompletion')} />
                  <p className="text-xs text-muted-foreground">
                    {t('itemCount', { completed: todoData?.completed ?? 0, total: todoData?.total ?? 0 })}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <RateGauge rate={routineData?.rate ?? 0} label={t('routineAchievement')} />
                  <p className="text-xs text-muted-foreground">
                    {t('timeCount', { completed: routineData?.completed_checkins ?? 0, total: routineData?.total_checkins ?? 0 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 루틴별 달성률 차트 */}
          {routineChartData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{t('routineByRate')}</CardTitle>
              </CardHeader>
              <CardContent>
                <RoutineBarChart
                  data={routineChartData}
                  dataKey={achievementRateLabel}
                />
              </CardContent>
            </Card>
          )}

          {/* 데이터 없음 */}
          {todoData?.total === 0 && routineData?.total_checkins === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">{t('noData')}</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
