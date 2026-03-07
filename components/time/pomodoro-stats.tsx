'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { usePomodoroStats } from '@/hooks/use-pomodoro-stats'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// Recharts SSR 방지 dynamic import
const BarChart = dynamic(
  () => import('recharts').then((m) => m.BarChart),
  { ssr: false }
)
const Bar = dynamic(
  () => import('recharts').then((m) => m.Bar),
  { ssr: false }
)
const XAxis = dynamic(
  () => import('recharts').then((m) => m.XAxis),
  { ssr: false }
)
const YAxis = dynamic(
  () => import('recharts').then((m) => m.YAxis),
  { ssr: false }
)
const Tooltip = dynamic(
  () => import('recharts').then((m) => m.Tooltip),
  { ssr: false }
)
const ResponsiveContainer = dynamic(
  () => import('recharts').then((m) => m.ResponsiveContainer),
  { ssr: false }
)

/**
 * 포모도로 통계 컴포넌트
 */
export function PomodoroStats() {
  const t = useTranslations('pomodoro')
  const [days, setDays] = useState<7 | 30>(7)
  const { data, isLoading } = usePomodoroStats(days)

  const totalHours = data
    ? (Math.floor(data.total_focus_minutes / 60) > 0
        ? `${Math.floor(data.total_focus_minutes / 60)}${t('hours_unit')} ${data.total_focus_minutes % 60}${t('minutes')}`
        : `${data.total_focus_minutes}${t('minutes')}`)
    : '-'

  // 요일 레이블 배열 (월~일)
  const weekdayLabels: string[] = t.raw('weekdays') as string[]

  // 날짜 레이블: MM/DD 형식
  const chartData = (data?.daily ?? []).map((d) => ({
    label: d.date.slice(5), // MM-DD
    sessions: d.sessions,
  }))

  return (
    <div className="space-y-4">
      {/* 헤더 + 기간 선택 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t('stats_title')}</h2>
        <div className="flex gap-1">
          <Button
            variant={days === 7 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(7)}
          >
            {t('days_7')}
          </Button>
          <Button
            variant={days === 30 ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDays(30)}
          >
            {t('days_30')}
          </Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              {t('total_sessions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">
              {isLoading ? '-' : (data?.total_sessions ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 pt-3 px-4">
            <CardTitle className="text-xs text-muted-foreground font-normal">
              {t('total_focus_time')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <p className="text-2xl font-bold">
              {isLoading ? '-' : totalHours}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 날짜별 BarChart */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm">{t('sessions')}</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-3">
          {isLoading ? (
            <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
              {'...'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  interval={days === 30 ? 6 : 0}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v) => [`${v as number}`, t('sessions')]}
                  labelStyle={{ fontSize: 11 }}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="sessions" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 요일별 평균 */}
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm">{t('avg_sessions_per_day')}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {isLoading ? (
            <div className="text-sm text-muted-foreground">-</div>
          ) : (
            <div className="grid grid-cols-7 gap-1 text-center">
              {(data?.by_weekday ?? []).map((w) => (
                <div key={w.weekday} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {weekdayLabels[w.weekday] ?? w.weekday}
                  </span>
                  <span className="text-sm font-semibold">{w.avg_sessions}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
