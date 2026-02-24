'use client'

import { useTranslations } from 'next-intl'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { EMOTION_ICONS, type EmotionType } from '@/types/diary'
import type { EmotionStatsData } from '@/app/api/diaries/emotion-stats/route'

interface EmotionPieChartProps {
  stats: EmotionStatsData
}

// 감정별 색상 매핑
const EMOTION_COLORS: Record<EmotionType, string> = {
  happy: '#facc15',      // 노랑
  sad: '#60a5fa',        // 파랑
  angry: '#f87171',      // 빨강
  anxious: '#fb923c',    // 주황
  excited: '#c084fc',    // 보라
  calm: '#34d399',       // 초록
  tired: '#94a3b8',      // 회색
  lonely: '#818cf8',     // 인디고
  grateful: '#f472b6',   // 핑크
  proud: '#fbbf24',      // 황금
}

// Legend content prop 커스텀 타입
interface LegendPayloadItem {
  value?: string | undefined
  color?: string | undefined
}

interface CustomLegendProps {
  payload?: readonly LegendPayloadItem[] | undefined
}

// Tooltip content prop 커스텀 타입
interface CustomTooltipPayloadItem {
  name?: string | undefined
  value?: number | undefined
}

interface CustomTooltipProps {
  active?: boolean | undefined
  payload?: readonly CustomTooltipPayloadItem[] | undefined
}

// 월별 감정 분포 도넛 차트 컴포넌트
export function EmotionPieChart({ stats }: EmotionPieChartProps) {
  const t = useTranslations('private.emotions')

  const { emotion_counts } = stats

  // 커스텀 Legend 렌더러 (감정 이모지 + 이름 표시)
  function renderCustomLegend(props: CustomLegendProps) {
    const { payload } = props
    if (!payload) return null

    return (
      <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
        {payload.map((entry) => {
          const emotion = (String(entry.value ?? '')) as EmotionType
          return (
            <li key={emotion} className="flex items-center gap-1 text-xs">
              <span
                className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span role="img" aria-label={t(emotion as Parameters<typeof t>[0])}>
                {EMOTION_ICONS[emotion]}
              </span>
              <span className="text-foreground">{t(emotion as Parameters<typeof t>[0])}</span>
            </li>
          )
        })}
      </ul>
    )
  }

  // 커스텀 Tooltip 렌더러
  function renderCustomTooltip(props: CustomTooltipProps) {
    const { active, payload } = props
    if (!active || !payload || payload.length === 0) return null

    const emotion = (payload[0].name ?? '') as EmotionType
    const count = payload[0].value ?? 0

    return (
      <div className="rounded-lg border bg-background px-3 py-2 shadow-md text-xs">
        <span role="img" aria-label={t(emotion as Parameters<typeof t>[0])}>
          {EMOTION_ICONS[emotion]}
        </span>
        {' '}
        <span className="font-medium">{t(emotion as Parameters<typeof t>[0])}</span>
        <span className="text-muted-foreground ml-1">{count}{t('timesUnit')}</span>
      </div>
    )
  }

  // 차트 데이터 생성 (횟수 > 0인 감정만)
  const chartData = (Object.entries(emotion_counts) as Array<[EmotionType, number]>)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([emotion, count]) => ({
      name: emotion,
      value: count,
      color: EMOTION_COLORS[emotion],
    }))

  if (chartData.length === 0) {
    return (
      <section aria-label={t('monthlyDistribution')}>
        <h2 className="text-sm font-semibold text-foreground mb-3">{t('monthlyDistribution')}</h2>
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('noEmotionData')}
        </p>
      </section>
    )
  }

  return (
    <section aria-label={t('monthlyDistribution')}>
      <h2 className="text-sm font-semibold text-foreground mb-3">{t('monthlyDistribution')}</h2>
      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius="40%"
              outerRadius="65%"
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              content={(props) =>
                renderCustomTooltip({
                  active: (props as { active?: boolean }).active,
                  payload: (
                    props as {
                      payload?: readonly { name?: string; value?: number }[]
                    }
                  ).payload,
                })
              }
            />
            <Legend
              content={(props) =>
                renderCustomLegend({
                  payload: (
                    props as {
                      payload?: readonly { value?: string; color?: string }[]
                    }
                  ).payload,
                })
              }
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
