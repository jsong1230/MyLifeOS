'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { SleepLog } from '@/types/health'

// 수면 시간 포맷 (예: 7.5 → "7시간 30분")
function formatSleepHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

// 수면 시간에 따른 막대 색상
function getBarColor(hours: number): string {
  if (hours >= 7) return 'bg-green-500'
  if (hours >= 5) return 'bg-orange-400'
  return 'bg-red-400'
}

// 요일 레이블 (월~일)
const DAY_LABELS = ['월', '화', '수', '목', '금', '토', '일']

interface SleepSummaryProps {
  logs: SleepLog[]
  weekLabel: string
}

// 주간 수면 요약 컴포넌트
// - 7일 막대 차트 (div 기반)
// - 평균 수면 시간 + 평균 수면 질
// - 이번 주 최장/최단 수면
export function SleepSummary({ logs, weekLabel }: SleepSummaryProps) {
  // 주간 최대 수면 시간 (막대 차트 비율 기준)
  const maxHours = Math.max(10, ...logs.map((l) => l.value))

  // 수면 날짜별 인덱스 매핑 (월=0 ~ 일=6)
  const logsByDayOfWeek: (SleepLog | null)[] = Array(7).fill(null)
  logs.forEach((log) => {
    const date = new Date(log.date)
    const dayOfWeek = date.getDay() // 0=일 → 6=토
    // 월요일 시작으로 변환: 월=0 ~ 일=6
    const idx = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    logsByDayOfWeek[idx] = log
  })

  // 집계 계산
  const totalLogs = logs.length
  const avgHours =
    totalLogs > 0
      ? Math.round((logs.reduce((sum, l) => sum + l.value, 0) / totalLogs) * 10) / 10
      : 0

  const qualityLogs = logs.filter((l) => l.value2 != null)
  const avgQuality =
    qualityLogs.length > 0
      ? Math.round(
          (qualityLogs.reduce((sum, l) => sum + (l.value2 ?? 0), 0) / qualityLogs.length) * 10
        ) / 10
      : 0

  // 최장/최단 수면
  const sortedByHours = [...logs].sort((a, b) => a.value - b.value)
  const minLog = sortedByHours[0]
  const maxLog = sortedByHours[sortedByHours.length - 1]

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{weekLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 7일 막대 차트 */}
        <div className="flex items-end gap-1 h-20">
          {logsByDayOfWeek.map((log, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
              {log ? (
                <>
                  {/* 막대 */}
                  <div
                    className="w-full rounded-t-sm transition-all"
                    style={{ height: `${(log.value / maxHours) * 100}%` }}
                  >
                    <div
                      className={cn('w-full h-full rounded-t-sm', getBarColor(log.value))}
                      title={`${formatSleepHours(log.value)}`}
                    />
                  </div>
                  {/* 수면 시간 레이블 */}
                  <span className="text-[9px] text-muted-foreground leading-none">
                    {log.value}h
                  </span>
                </>
              ) : (
                <div className="w-full h-full flex items-end justify-center pb-4">
                  <div className="w-full h-1 rounded bg-gray-100 dark:bg-gray-800" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 요일 레이블 */}
        <div className="flex gap-1">
          {DAY_LABELS.map((day) => (
            <div key={day} className="flex-1 text-center text-[10px] text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        <Separator />

        {/* 평균 통계 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">평균 수면 시간</p>
            <p className="text-lg font-bold">
              {totalLogs > 0 ? `${avgHours}h` : '-'}
            </p>
            {totalLogs > 0 && (
              <p className="text-xs text-muted-foreground">{formatSleepHours(avgHours)}</p>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">평균 수면 질</p>
            <p className="text-lg font-bold">
              {qualityLogs.length > 0 ? `${avgQuality} / 5` : '-'}
            </p>
            {qualityLogs.length > 0 && (
              <p className="text-xs text-yellow-500">
                {'★'.repeat(Math.round(avgQuality))}
                {'☆'.repeat(5 - Math.round(avgQuality))}
              </p>
            )}
          </div>
        </div>

        {/* 최장/최단 수면 */}
        {totalLogs > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">이번 주 최장</p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {formatSleepHours(maxLog.value)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">이번 주 최단</p>
                <p className="text-sm font-semibold text-red-500 dark:text-red-400">
                  {formatSleepHours(minLog.value)}
                </p>
              </div>
            </div>
          </>
        )}

        {totalLogs === 0 && (
          <p className="text-center text-sm text-muted-foreground py-2">
            이번 주 수면 기록이 없습니다
          </p>
        )}
      </CardContent>
    </Card>
  )
}
