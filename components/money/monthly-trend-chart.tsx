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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MonthlyData {
  month: string    // YYYY-MM
  income: number
  expense: number
}

interface MonthlyTrendChartProps {
  data: MonthlyData[]
}

// YYYY-MM → M월
function formatMonth(month: string): string {
  const [, m] = month.split('-')
  return `${parseInt(m)}월`
}

// 금액 축 포맷 (만원 단위)
function formatYAxis(value: number): string {
  if (value >= 10_000_000) return `${(value / 10_000_000).toFixed(0)}천만`
  if (value >= 10_000) return `${Math.floor(value / 10_000)}만`
  return `${value}`
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (data.every((d) => d.income === 0 && d.expense === 0)) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          거래 내역이 없습니다
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    수입: d.income,
    지출: d.expense,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">월별 수입/지출 추이</CardTitle>
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
                value != null ? `${value.toLocaleString('ko-KR')}원` : '-',
                name ?? '',
              ]}
            />
            <Legend
              iconType="square"
              iconSize={8}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
            <Bar dataKey="수입" fill="#22c55e" radius={[3, 3, 0, 0]} />
            <Bar dataKey="지출" fill="#ef4444" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
