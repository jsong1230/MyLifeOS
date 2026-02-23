'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BodyLog } from '@/types/health'

interface BodyTrendChartProps {
  logs: BodyLog[]
}

// YYYY-MM-DD → M/D
function formatDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${parseInt(m)}/${parseInt(d)}`
}

export function BodyTrendChart({ logs }: BodyTrendChartProps) {
  // 최신순 → 오름차순 정렬 (차트는 시간 순)
  const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
  const chartData = sorted.map((log) => ({
    date: formatDate(log.date),
    체중: log.weight ?? undefined,
    체지방률: log.body_fat ?? undefined,
    근육량: log.muscle_mass ?? undefined,
  }))

  const hasWeight = sorted.some((l) => l.weight != null)
  const hasBodyFat = sorted.some((l) => l.body_fat != null)
  const hasMuscleMass = sorted.some((l) => l.muscle_mass != null)

  if (chartData.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">체중/체성분 추이</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
            <Tooltip />
            <Legend
              iconSize={8}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
            {hasWeight && (
              <Line type="monotone" dataKey="체중" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            )}
            {hasBodyFat && (
              <Line type="monotone" dataKey="체지방률" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            )}
            {hasMuscleMass && (
              <Line type="monotone" dataKey="근육량" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
