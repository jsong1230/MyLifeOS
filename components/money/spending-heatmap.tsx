'use client'

import { useLocale, useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { formatCurrencyCompact, type CurrencyCode } from '@/lib/currency'
import type { HeatmapData } from '@/app/api/money/stats/heatmap/route'

interface SpendingHeatmapProps {
  data: HeatmapData
}

// 금액에 따른 배경색 강도 클래스 반환
// 0=회색, 나머지는 금액 분위에 따라 파란색 5단계
function getIntensityClass(amount: number, max: number): string {
  if (amount === 0 || max === 0) return 'bg-muted/30 text-muted-foreground/50'
  const ratio = amount / max
  if (ratio >= 0.8) return 'bg-blue-600 text-white'
  if (ratio >= 0.6) return 'bg-blue-500 text-white'
  if (ratio >= 0.4) return 'bg-blue-400 text-white'
  if (ratio >= 0.2) return 'bg-blue-300 text-blue-900'
  return 'bg-blue-100 text-blue-800'
}

export function SpendingHeatmap({ data }: SpendingHeatmapProps) {
  const t = useTranslations('moneyStats')
  const locale = useLocale()

  const { months, categories } = data

  if (categories.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">{t('no_data')}</p>
    )
  }

  // 전체 데이터에서 최대 금액 계산 (색상 스케일 기준)
  const allAmounts = categories.flatMap((cat) =>
    cat.monthly_totals.map((m) => m.amount)
  )
  const maxAmount = Math.max(...allAmounts, 1)

  // 월 라벨 포맷 (YYYY-MM → 번역 키로 단월 표시)
  function formatMonthLabel(ym: string): string {
    const monthIdx = parseInt(ym.split('-')[1], 10) - 1
    const monthNames = t.raw('months') as string[]
    return monthNames[monthIdx] ?? ym
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="min-w-full border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            {/* 카테고리 열 헤더 */}
            <th className="text-left font-medium text-muted-foreground pb-2 pr-3 whitespace-nowrap w-28 min-w-[7rem]">
              {t('heatmap')}
            </th>
            {months.map((month) => (
              <th
                key={month}
                className="text-center font-medium text-muted-foreground pb-2 px-1 whitespace-nowrap min-w-[3.5rem]"
              >
                {formatMonthLabel(month)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td className="text-left font-medium pr-3 py-1 whitespace-nowrap truncate max-w-[7rem]">
                {cat.name}
              </td>
              {cat.monthly_totals.map((entry) => (
                <td key={`${cat.id}-${entry.month}`} className="py-1 px-1">
                  <div
                    className={cn(
                      'rounded-md text-center font-medium py-1.5 px-1 min-w-[3.5rem] transition-colors',
                      getIntensityClass(entry.amount, maxAmount)
                    )}
                    title={`${cat.name} / ${entry.month}: ${
                      entry.amount > 0
                        ? formatCurrencyCompact(entry.amount, entry.currency as CurrencyCode, locale)
                        : '-'
                    }`}
                  >
                    {entry.amount > 0
                      ? formatCurrencyCompact(
                          entry.amount,
                          entry.currency as CurrencyCode,
                          locale
                        )
                      : '—'}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* 범례 */}
      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span className="text-xs text-muted-foreground">낮음</span>
        {['bg-blue-100', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500', 'bg-blue-600'].map(
          (cls) => (
            <span key={cls} className={cn('inline-block w-5 h-5 rounded', cls)} />
          )
        )}
        <span className="text-xs text-muted-foreground">높음</span>
        <span className="ml-2 inline-block w-5 h-5 rounded bg-muted/30 border border-border" />
        <span className="text-xs text-muted-foreground">없음</span>
      </div>
    </div>
  )
}
