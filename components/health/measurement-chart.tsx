'use client'

import { useTranslations, useLocale } from 'next-intl'
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
import type { HealthMeasurement, MeasurementType } from '@/types/health_measurement'

interface MeasurementChartProps {
  measurements: HealthMeasurement[]
  type: MeasurementType
}

interface ChartDataPoint {
  date: string
  value: number
  value2?: number
}

function formatChartDate(isoString: string, locale: string): string {
  const date = new Date(isoString)
  if (locale === 'ko') {
    return `${date.getMonth() + 1}/${date.getDate()}`
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date)
}

export function MeasurementChart({ measurements, type }: MeasurementChartProps) {
  const t = useTranslations('health.measurements')
  const locale = useLocale()

  // 시간순 정렬 후 차트 데이터 변환
  const chartData: ChartDataPoint[] = [...measurements]
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())
    .map((m) => ({
      date: formatChartDate(m.measured_at, locale),
      value: m.value,
      ...(type === 'blood_pressure' && m.value2 !== null ? { value2: m.value2 } : {}),
    }))

  if (chartData.length === 0) {
    return null
  }

  const isBloodPressure = type === 'blood_pressure'

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 11 }}
          className="fill-muted-foreground"
          domain={['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
          }}
        />
        {isBloodPressure && (
          <Legend
            formatter={(value: string) =>
              value === 'value' ? t('systolic') : t('diastolic')
            }
          />
        )}
        <Line
          type="monotone"
          dataKey="value"
          stroke={isBloodPressure ? '#ef4444' : '#3b82f6'}
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
          name={isBloodPressure ? t('systolic') : (type === 'blood_sugar' ? t('blood_sugar') : t('body_temp'))}
        />
        {isBloodPressure && (
          <Line
            type="monotone"
            dataKey="value2"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            name={t('diastolic')}
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
