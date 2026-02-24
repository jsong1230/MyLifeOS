'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import type { SleepLog } from '@/types/health'

interface SleepSummary {
  avg_hours: number
  avg_quality: number
}

interface SleepWeeklyCardProps {
  summary: SleepSummary
  logs: SleepLog[]
}

// 수면 시간에 따른 색상 클래스
function getSleepHoursColor(hours: number): string {
  if (hours >= 7) return 'bg-green-400'
  if (hours >= 5) return 'bg-orange-400'
  return 'bg-red-400'
}

function getSleepHoursTextColor(hours: number): string {
  if (hours >= 7) return 'text-green-600 dark:text-green-400'
  if (hours >= 5) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// 최근 7일 수면 현황 카드
export function SleepWeeklyCard({ summary, logs }: SleepWeeklyCardProps) {
  const t = useTranslations('health.sleep')
  const tCalendar = useTranslations('time.calendar')

  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

  const sortedLogs = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)

  const maxBarHours = Math.max(9, ...sortedLogs.map((log) => log.value))
  const hasData = logs.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-lg">😴</span>
          {t('recentSleep')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('noSleepThisWeek')}
          </p>
        ) : (
          <>
            {/* 평균 수면 시간 */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{t('avgHours')}</p>
              <div className="flex items-baseline gap-2">
                <span
                  className={cn(
                    'text-3xl font-bold',
                    getSleepHoursTextColor(summary.avg_hours)
                  )}
                >
                  {formatHours(summary.avg_hours)}
                </span>
              </div>
            </div>

            {/* 평균 수면 질 별점 */}
            {summary.avg_quality > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t('avgQuality')}</p>
                <div
                  className="flex gap-0.5"
                  aria-label={t('qualityScore', { score: Math.round(summary.avg_quality) })}
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'text-base',
                        i < Math.round(summary.avg_quality) ? 'text-yellow-400' : 'text-muted-foreground/30'
                      )}
                      aria-hidden="true"
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 7일 미니 바 차트 */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground mb-2">{t('dailySleep')}</p>
              <div className="flex items-end gap-1 h-16" aria-label={t('dailySleep')}>
                {sortedLogs.map((log) => {
                  const heightPercent =
                    maxBarHours > 0 ? (log.value / maxBarHours) * 100 : 0
                  const dateObj = new Date(log.date + 'T00:00:00')
                  const dayKey = dayKeys[dateObj.getDay()]

                  return (
                    <div
                      key={log.id}
                      className="flex flex-col items-center gap-1 flex-1"
                    >
                      <div className="w-full flex items-end h-12">
                        <div
                          className={cn(
                            'w-full rounded-t-sm transition-all',
                            getSleepHoursColor(log.value)
                          )}
                          style={{ height: `${Math.max(4, heightPercent)}%` }}
                          role="img"
                          aria-label={`${log.date} ${formatHours(log.value)}`}
                          title={`${log.date}: ${formatHours(log.value)}`}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {tCalendar(`weekdays.${dayKey}`)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
