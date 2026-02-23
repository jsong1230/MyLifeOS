'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AssetMonthlyTotal } from '@/types/asset'

interface AssetTrendChartProps {
  data: AssetMonthlyTotal[]
}

// YYYY-MM → M월
function formatMonth(month: string): string {
  const [, m] = month.split('-')
  return `${parseInt(m)}월`
}

// 금액 축 포맷 (만원 단위)
function formatYAxis(value: number): string {
  if (value >= 100_000_000) return `${(value / 100_000_000).toFixed(0)}억`
  if (value >= 10_000) return `${Math.floor(value / 10_000)}만`
  return `${value}`
}

export function AssetTrendChart({ data }: AssetTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          자산 추이 데이터가 없습니다
        </CardContent>
      </Card>
    )
  }

  const chartData = data.map((d) => ({
    month: formatMonth(d.month),
    total: d.total,
  }))

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">월별 자산 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
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
              formatter={(value: number | undefined) => [
                value != null ? `${value.toLocaleString('ko-KR')}원` : '-',
                '총 자산',
              ]}
              labelFormatter={(label) => `${label}`}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4, fill: 'hsl(var(--primary))' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
