'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { useTranslations, useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { formatCurrency, type CurrencyCode } from '@/lib/currency'
import { useSettingsStore } from '@/store/settings.store'
import type { BudgetStatus } from '@/types/budget'

interface ExpenseBarChartProps {
  budgets: BudgetStatus[]
}

// 지출 달성률에 따른 바 색상 결정
// 80% 미만: 파랑, 80~100%: 주황, 100% 초과: 빨강
function getBarColor(percentage: number): string {
  if (percentage >= 100) return '#ef4444'  // 빨강
  if (percentage >= 80) return '#f97316'   // 주황
  return '#3b82f6'                          // 파랑
}

// 차트 데이터 타입
interface ChartDataItem {
  name: string
  budget: number
  spent: number
  percentage: number
}

// CustomTooltip은 모듈 레벨에 유지 (locale은 컴포넌트 내부에서 처리)

// 툴팁 커스터마이징
function CustomTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
  label?: string
  currency: CurrencyCode
}) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm space-y-1">
      <p className="font-semibold text-foreground">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-muted-foreground">
          <span className="font-medium text-foreground">{entry.name}: </span>
          {formatCurrency(entry.value, currency)}
        </p>
      ))}
    </div>
  )
}

// 카테고리별 예산 대비 지출 달성률 바 차트
export function ExpenseBarChart({ budgets }: ExpenseBarChartProps) {
  const t = useTranslations('money.charts')
  const tb = useTranslations('money.budget')
  const locale = useLocale()
  const defaultCurrency = useSettingsStore((s) => s.defaultCurrency) ?? 'KRW'

  // 금액 축 포맷터 — 로케일 기반 단위로 축약
  function formatYAxis(value: number): string {
    if (locale === 'ko') {
      if (value >= 10_000) return `${(value / 10_000).toFixed(0)}만`
      return value.toLocaleString(locale)
    }
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
    if (value >= 1_000) return `${Math.floor(value / 1_000)}K`
    return value.toLocaleString(locale)
  }

  // 설정된 예산이 없을 경우 빈 상태 메시지 표시
  if (budgets.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-64',
          'text-sm text-muted-foreground'
        )}
      >
        {tb('noData')}
      </div>
    )
  }

  // 차트 데이터 변환
  const chartData: ChartDataItem[] = budgets.map((budget) => ({
    name: budget.category?.name ?? tb('uncategorized'),
    budget: budget.amount,
    spent: budget.spent,
    percentage: budget.percentage,
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={45}
        />
        <Tooltip content={<CustomTooltip currency={defaultCurrency as CurrencyCode} />} />
        <Legend
          formatter={(value) => (
            <span className="text-sm text-foreground">{value}</span>
          )}
        />
        {/* 100% 기준선 — 예산 초과 시각화 */}
        <ReferenceLine y={0} stroke="#e5e7eb" />
        {/* 예산 바 (회색) */}
        <Bar dataKey="budget" name={t('budget')} fill="#d1d5db" radius={[4, 4, 0, 0]} />
        {/* 지출 바 — 달성률에 따라 색상 동적 적용 */}
        <Bar dataKey="spent" name={t('spent')} radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={getBarColor(entry.percentage)}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
