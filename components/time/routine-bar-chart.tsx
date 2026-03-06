'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface RoutineBarChartProps {
  data: Record<string, string | number>[]
  dataKey: string
}

export function RoutineBarChart({ data, dataKey }: RoutineBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v as number}%`}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip formatter={(v) => [`${v as number}%`, dataKey]} />
        <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell
              key={idx}
              fill={
                (entry[dataKey] as number) >= 80
                  ? '#22c55e'
                  : (entry[dataKey] as number) >= 50
                    ? '#f59e0b'
                    : '#ef4444'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
