'use client'

import { cn } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import type { SleepLog } from '@/types/health'

interface SleepSummary {
  avg_hours: number    // 평균 수면 시간
  avg_quality: number  // 평균 수면 질 (1-5)
}

interface SleepWeeklyCardProps {
  summary: SleepSummary
  logs: SleepLog[]
}

// 수면 시간에 따른 색상 클래스 반환
// 7h+ = 초록, 5-7h = 주황, 5h 미만 = 빨강
function getSleepHoursColor(hours: number): string {
  if (hours >= 7) return 'bg-green-400'
  if (hours >= 5) return 'bg-orange-400'
  return 'bg-red-400'
}

// 수면 시간 텍스트 색상
function getSleepHoursTextColor(hours: number): string {
  if (hours >= 7) return 'text-green-600 dark:text-green-400'
  if (hours >= 5) return 'text-orange-600 dark:text-orange-400'
  return 'text-red-600 dark:text-red-400'
}

// 수면 시간 포맷 (소수점 → 시간:분)
function formatHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// 별점 컴포넌트 (수면 질 1-5)
function StarRating({ value }: { value: number }) {
  const rounded = Math.round(value)
  return (
    <div className="flex gap-0.5" aria-label={`수면 질 ${rounded}점`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            'text-base',
            i < rounded ? 'text-yellow-400' : 'text-muted-foreground/30'
          )}
          aria-hidden="true"
        >
          ★
        </span>
      ))}
    </div>
  )
}

// 최근 7일 수면 현황 카드
export function SleepWeeklyCard({ summary, logs }: SleepWeeklyCardProps) {
  // 날짜 오름차순 정렬 후 최근 7일만 표시
  const sortedLogs = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)

  // 미니 바 차트의 최대 높이 기준 — 최대 수면 시간 또는 9h (적절한 척도)
  const maxBarHours = Math.max(9, ...sortedLogs.map((log) => log.value))

  const hasData = logs.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {/* 수면 아이콘 */}
          <span className="text-lg">😴</span>
          최근 7일 수면
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasData ? (
          // 데이터 없음 상태
          <p className="text-sm text-muted-foreground text-center py-4">
            이번 주 수면 기록이 없습니다
          </p>
        ) : (
          <>
            {/* 평균 수면 시간 */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">평균 수면 시간</p>
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
                <p className="text-xs text-muted-foreground">평균 수면 질</p>
                <StarRating value={summary.avg_quality} />
              </div>
            )}

            {/* 7일 미니 바 차트 — div 기반 */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground mb-2">일별 수면 시간</p>
              <div className="flex items-end gap-1 h-16" aria-label="7일 수면 시간 차트">
                {sortedLogs.map((log) => {
                  const heightPercent =
                    maxBarHours > 0 ? (log.value / maxBarHours) * 100 : 0
                  // 날짜에서 요일 추출
                  const dateObj = new Date(log.date + 'T00:00:00')
                  const dayLabel = ['일', '월', '화', '수', '목', '금', '토'][
                    dateObj.getDay()
                  ]

                  return (
                    <div
                      key={log.id}
                      className="flex flex-col items-center gap-1 flex-1"
                    >
                      {/* 바 */}
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
                      {/* 요일 레이블 */}
                      <span className="text-[10px] text-muted-foreground">
                        {dayLabel}
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
