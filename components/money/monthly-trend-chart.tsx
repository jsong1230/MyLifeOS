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
} from 'recharts'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/currency'

interface MonthlyData {
  month: string    // YYYY-MM
  income: number
  expense: number
}

interface MonthlyTrendChartProps {
  data: MonthlyData[]
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  const t = useTranslations('money.charts')
  const locale = useLocale()

  // 로케일 기반 월 표시 (ko: "1월", en: "Jan")
  function formatMonthLabel(month: string): string {
    const date = new Date(month + '-01T00:00:00')
    return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', { month: 'short' }).format(date)
  }

  // 금액 축 포맷 (로케일 기반 단위)
  function formatYAxis(value: number): string {
    if (locale === 'ko') {
      if (value >= 10_000_000) return `${(value / 10_000_000).toFixed(0)}${t('unitChonMan')}`
      if (value >= 10_000) return `${Math.floor(value / 10_000)}${t('unitMan')}`
      return `${value}`
    }
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`
    if (value >= 1_000) return `${Math.floor(value / 1_000)}K`
    return `${value}`
  }

  if (data.every((d) => d.income === 0 && d.expense === 0)) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {t('noData')}
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    month: formatMonthLabel(d.month),
    income: d.income,
    expense: d.expense,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t('monthlyTrend')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={42}
            />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => [
                value != null ? formatCurrency(value, 'KRW') : '-',
                name ?? '',
              ]}
            />
            <Legend
              iconType="square"
              iconSize={8}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
            <Bar dataKey="income" name={t('income')} fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expense" name={t('expense')} fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
