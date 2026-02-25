'use client'

import { useTranslations } from 'next-intl'
import { EMOTION_ICONS, type EmotionType } from '@/types/diary'
import { formatCurrency } from '@/lib/currency'
import { useSettingsStore } from '@/store/settings.store'
import type { WeeklyReport } from '@/types/report'

interface WeeklyReportProps {
  report: WeeklyReport
}

// 원형 진행바 CSS 구현 (SVG 기반)
function CircularProgress({ rate, ariaLabel }: { rate: number; ariaLabel: string }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  // rate 0~100 → strokeDashoffset 계산
  const offset = circumference - (rate / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        aria-label={ariaLabel}
        role="img"
      >
        {/* 배경 원 */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        {/* 진행 원 */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-500"
          transform="rotate(-90 48 48)"
        />
      </svg>
      {/* 중앙 텍스트 */}
      <span className="absolute text-lg font-bold">{rate}%</span>
    </div>
  )
}

// 주간 리포트 컴포넌트
export function WeeklyReportView({ report }: WeeklyReportProps) {
  const t = useTranslations('reports')
  const te = useTranslations('private.emotions')
  const currency = useSettingsStore((s) => s.defaultCurrency)
  const { todos, spending, health, emotions } = report

  // 감정 분포: 횟수 내림차순 정렬
  const sortedEmotions = Object.entries(emotions).sort(([, a], [, b]) => b - a)

  // 주간 종료일 계산 (주 시작 + 6일)
  const weekEndDate = new Date(report.week_start)
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6)
  const weekEnd = weekEndDate.toISOString().split('T')[0]

  return (
    <div className="space-y-5">
      {/* 기간 표시 */}
      <p className="text-sm text-muted-foreground text-center">
        {report.week_start} ~ {weekEnd}
      </p>

      {/* ── 할일 완료율 ── */}
      <section aria-labelledby="weekly-todos-heading">
        <h3
          id="weekly-todos-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          {t('todoCompletion')}
        </h3>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-6">
          <CircularProgress rate={todos.rate} ariaLabel={t('circularProgressLabel', { rate: todos.rate })} />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              {t('todoTotal')} <span className="font-semibold text-foreground">{t('todoCountSuffix', { count: todos.total })}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              {t('todoCompleted')} <span className="font-semibold text-primary">{t('todoCountSuffix', { count: todos.completed })}</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── 수입/지출 요약 ── */}
      <section aria-labelledby="weekly-spending-heading">
        <h3
          id="weekly-spending-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          {t('incomeExpense')}
        </h3>
        <div className="bg-card border rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('income')}</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(spending.income, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('expense')}</p>
            <p className="text-base font-bold text-red-500">
              -{formatCurrency(spending.expense, currency)}
            </p>
          </div>
        </div>
      </section>

      {/* ── 건강 지표 ── */}
      <section aria-labelledby="weekly-health-heading">
        <h3
          id="weekly-health-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          {t('healthMetrics')}
        </h3>
        <div className="bg-card border rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('avgSleepWeekly')}</p>
            <p className="text-base font-bold">
              {health.avg_sleep > 0 ? t('sleepHours', { hours: health.avg_sleep }) : t('noRecord')}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('drinkDays')}</p>
            <p className="text-base font-bold">{t('daysUnit', { days: health.drink_days })}</p>
          </div>
        </div>
      </section>

      {/* ── 감정 분포 ── */}
      <section aria-labelledby="weekly-emotions-heading">
        <h3
          id="weekly-emotions-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          {t('emotionDist')}
        </h3>
        {sortedEmotions.length === 0 ? (
          <div className="bg-card border rounded-xl p-4 text-center text-sm text-muted-foreground">
            {t('noDiaryWeek')}
          </div>
        ) : (
          <div className="bg-card border rounded-xl p-4">
            <div className="flex flex-wrap gap-3">
              {sortedEmotions.map(([tag, count]) => {
                const emotionType = tag as EmotionType
                const icon = EMOTION_ICONS[emotionType] ?? '❓'
                const label = te(emotionType as Parameters<typeof te>[0])
                return (
                  <div
                    key={tag}
                    className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-1.5"
                  >
                    <span aria-hidden="true" className="text-lg">
                      {icon}
                    </span>
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
