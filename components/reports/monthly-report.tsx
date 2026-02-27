'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { EMOTION_ICONS, type EmotionType } from '@/types/diary'
import { formatCurrency, type CurrencyCode } from '@/lib/currency'
import type { MonthlyReport } from '@/types/report'

interface MonthlyReportProps {
  report: MonthlyReport
}

// 할일 완료율 바 컴포넌트 (선형 프로그레스)
function LinearProgress({ rate, completionLabel, ariaLabel }: { rate: number; completionLabel: string; ariaLabel: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{completionLabel}</span>
        <span className="font-semibold text-primary">{rate}%</span>
      </div>
      <div
        className="h-2.5 bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={rate}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel}
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  )
}

// 전월 대비 증감 표시 컴포넌트
function SpendingTrend({ changePct, sameLabel, vsLabel }: { changePct: number; sameLabel: string; vsLabel: string }) {
  if (changePct === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="w-4 h-4" aria-hidden="true" />
        <span className="text-sm font-medium">{sameLabel}</span>
      </div>
    )
  }

  const isUp = changePct > 0
  return (
    <div
      className={`flex items-center gap-1 ${isUp ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}
    >
      {isUp ? (
        <TrendingUp className="w-4 h-4" aria-hidden="true" />
      ) : (
        <TrendingDown className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="text-sm font-semibold">
        {isUp ? '+' : ''}{changePct}%
      </span>
      <span className="text-xs text-muted-foreground">{vsLabel}</span>
    </div>
  )
}

// 월간 리포트 컴포넌트
export function MonthlyReportView({ report }: MonthlyReportProps) {
  const t = useTranslations('reports')
  const te = useTranslations('private.emotions')
  const { todos, spending, health, emotions } = report
  const currencyEntries = Object.entries(spending.byCurrency)

  // 감정 분포: 횟수 내림차순 정렬
  const sortedEmotions = Object.entries(emotions).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-5">
      {/* ── 할일 완료율 ── */}
      <section aria-labelledby="monthly-todos-heading">
        <h3
          id="monthly-todos-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          {t('todoCompletion')}
        </h3>
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <LinearProgress
            rate={todos.rate}
            completionLabel={t('completionRate')}
            ariaLabel={t('circularProgressLabel', { rate: todos.rate })}
          />
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>
              {t('todoTotal')} <span className="font-semibold text-foreground">{t('todoCountSuffix', { count: todos.total })}</span>
            </span>
            <span>
              {t('todoCompleted')} <span className="font-semibold text-primary">{t('todoCountSuffix', { count: todos.completed })}</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── 지출 현황 (통화별 + 전월 대비) ── */}
      <section aria-labelledby="monthly-spending-heading">
        <h3
          id="monthly-spending-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          {t('spendingTitle')}
        </h3>
        <div className="bg-card border rounded-xl overflow-hidden">
          {currencyEntries.length === 0 ? (
            <p className="p-4 text-sm text-center text-muted-foreground">{t('noSpending')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">{t('currency')}</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">{t('income')}</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">{t('expense')}</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">{t('prevMonthExpense')}</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">{t('vsLastMonth')}</th>
                </tr>
              </thead>
              <tbody>
                {currencyEntries.map(([curr, { income, expense, prev_expense, change_pct }]) => (
                  <tr key={curr} className="border-b last:border-0">
                    <td className="px-4 py-3 font-semibold">{curr}</td>
                    <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400 font-medium">
                      +{formatCurrency(income, curr as CurrencyCode)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500 font-medium">
                      -{formatCurrency(expense, curr as CurrencyCode)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {formatCurrency(prev_expense, curr as CurrencyCode)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <SpendingTrend changePct={change_pct} sameLabel="—" vsLabel="" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── 건강 요약 ── */}
      <section aria-labelledby="monthly-health-heading">
        <h3
          id="monthly-health-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          {t('healthSummary')}
        </h3>
        <div className="bg-card border rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{t('avgSleepMonthly')}</p>
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
      <section aria-labelledby="monthly-emotions-heading">
        <h3
          id="monthly-emotions-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          {t('emotionDist')}
        </h3>
        {sortedEmotions.length === 0 ? (
          <div className="bg-card border rounded-xl p-4 text-center text-sm text-muted-foreground">
            {t('noDiaryMonth')}
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
