'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DrinkLog } from '@/types/health'

// 요일 키 (월~일, Monday-first)
const DAY_KEYS_MON_FIRST = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

interface DrinkSummaryProps {
  logs: DrinkLog[]
  weekLabel: string
}

// 날짜 문자열(YYYY-MM-DD)의 요일 인덱스 반환 (0=월, ..., 6=일)
function getDayIndex(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay() // 0=일, 1=월, ..., 6=토
  return day === 0 ? 6 : day - 1 // 월요일 기준으로 변환
}

// WHO 기준 주간 권장 음주 잔수
const WHO_WEEKLY_LIMIT = 14
const WHO_CAUTION_PCT = 0.8 // 80% 이상 시 주의

// 이번 주 음주 기록 요약 카드 컴포넌트
export function DrinkSummary({ logs, weekLabel }: DrinkSummaryProps) {
  const t = useTranslations('health.drinks')
  const tw = useTranslations('time.calendar.weekdays')

  const DAY_LABELS = DAY_KEYS_MON_FIRST.map((key) => tw(key))

  // 요일별 음주량 집계 (인덱스 0=월 ~ 6=일)
  const dailyAmounts = Array.from({ length: 7 }, () => 0)
  for (const log of logs) {
    const idx = getDayIndex(log.date)
    dailyAmounts[idx] += Number(log.amount_ml)
  }

  const maxAmount = Math.max(...dailyAmounts, 1) // 0으로 나누기 방지

  // 총 잔수 집계
  const totalCount = logs.reduce((acc, log) => acc + (Number(log.drink_count) || 0), 0)

  // WHO 경고 상태
  const hasCountData = logs.some((l) => l.drink_count != null && Number(l.drink_count) > 0)
  const isOverLimit = hasCountData && totalCount >= WHO_WEEKLY_LIMIT
  const isNearLimit = hasCountData && !isOverLimit && totalCount >= WHO_WEEKLY_LIMIT * WHO_CAUTION_PCT

  // 총 음주량 집계
  const totalMl = logs.reduce((acc, log) => acc + Number(log.amount_ml), 0)

  // 음주 횟수 (고유 날짜 기준)
  const drinkDays = new Set(logs.map((log) => log.date)).size

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">{weekLabel}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 요약 통계 3개 카드 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t('drinkDays')}</p>
            <p className="text-xl font-bold text-foreground">{drinkDays}</p>
            <p className="text-xs text-muted-foreground">{t('dayUnit')}</p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t('totalAmountLabel')}</p>
            <p className="text-xl font-bold text-foreground">
              {totalMl >= 1000
                ? `${(totalMl / 1000).toFixed(1)}L`
                : `${totalMl.toFixed(0)}`}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalMl >= 1000 ? '' : 'ml'}
            </p>
          </div>
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">{t('totalCountLabel')}</p>
            <p className="text-xl font-bold text-foreground">
              {totalCount > 0 ? totalCount.toFixed(totalCount % 1 === 0 ? 0 : 1) : '-'}
            </p>
            <p className="text-xs text-muted-foreground">{totalCount > 0 ? t('unit') : ''}</p>
          </div>
        </div>

        {/* WHO 기준 경고/주의 배너 */}
        {isOverLimit && (
          <div className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium',
            'bg-red-50 text-red-700 border border-red-200',
            'dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
          )}>
            {t('whoExceed', { limit: WHO_WEEKLY_LIMIT, count: totalCount })}
          </div>
        )}
        {isNearLimit && (
          <div className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium',
            'bg-yellow-50 text-yellow-700 border border-yellow-200',
            'dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
          )}>
            {t('whoNear', { count: totalCount, limit: WHO_WEEKLY_LIMIT })}
          </div>
        )}

        {/* 요일별 음주량 막대 그래프 (div 기반) */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">{t('weeklyAmountChart')}</p>
          <div className="flex items-end gap-1 h-16">
            {DAY_LABELS.map((dayLabel, idx) => {
              const amount = dailyAmounts[idx]
              const heightPct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0
              const hasData = amount > 0

              return (
                <div
                  key={dayLabel}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={hasData ? `${dayLabel}: ${amount}ml` : `${dayLabel}: -`}
                >
                  <div className="w-full flex items-end" style={{ height: '48px' }}>
                    <div
                      className={cn(
                        'w-full rounded-t-sm transition-all',
                        hasData
                          ? 'bg-amber-400'
                          : 'bg-muted'
                      )}
                      style={{
                        height: hasData ? `${Math.max(heightPct, 8)}%` : '4px',
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-[10px]',
                      hasData ? 'text-foreground font-medium' : 'text-muted-foreground'
                    )}
                  >
                    {dayLabel}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* 기록이 없는 경우 안내 문구 */}
        {logs.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-1">
            {t('noDrinksThisWeek')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
