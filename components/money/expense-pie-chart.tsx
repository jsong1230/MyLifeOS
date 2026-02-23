'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/transaction'

interface ExpensePieChartProps {
  transactions: Transaction[]
}

// 기본 색상 팔레트 (category.color 미설정 시 순서대로 사용)
const DEFAULT_COLORS = [
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#3b82f6', // blue
  '#84cc16', // lime
]

const RADIAN = Math.PI / 180

// 파이 내부 퍼센트 라벨 렌더러 — PieLabelRenderProps 필드가 optional이므로 undefined 처리
function renderCustomizedLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx?: number
  cy?: number
  midAngle?: number
  innerRadius?: number
  outerRadius?: number
  percent?: number
}) {
  // 필수 값이 없으면 렌더링 생략
  if (
    cx === undefined ||
    cy === undefined ||
    midAngle === undefined ||
    innerRadius === undefined ||
    outerRadius === undefined ||
    percent === undefined
  ) {
    return null
  }

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  // 5% 미만 슬라이스는 라벨 생략
  return percent > 0.05 ? (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  ) : null
}

// 툴팁 커스터마이징
function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>
}) {
  if (!active || !payload || payload.length === 0) return null

  const item = payload[0]
  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-sm">
      <p className="font-medium text-foreground">{item.name}</p>
      <p className="text-muted-foreground">
        {item.value.toLocaleString('ko-KR')}원
      </p>
    </div>
  )
}

// 카테고리별 지출 비율 파이 차트
export function ExpensePieChart({ transactions }: ExpensePieChartProps) {
  // 지출 타입 거래만 카테고리별 집계
  const expenseByCategory = transactions
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, { amount: number; color: string | null | undefined; name: string }>>((acc, t) => {
      const key = t.category_id ?? 'unknown'
      const name = t.category?.name ?? '미분류'
      const color = t.category?.color

      if (!acc[key]) {
        acc[key] = { amount: 0, color, name }
      }
      acc[key].amount += t.amount
      return acc
    }, {})

  const chartData = Object.entries(expenseByCategory).map(([, info]) => ({
    name: info.name,
    value: info.amount,
    fill: info.color ?? undefined,
  }))

  // 지출 내역이 없을 경우 빈 상태 메시지 표시
  if (chartData.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-64',
          'text-sm text-muted-foreground'
        )}
      >
        이번달 지출 내역이 없습니다
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius={110}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.fill ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => (
            <span className="text-sm text-foreground">{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
