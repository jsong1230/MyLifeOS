'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HeatmapEntry } from '@/hooks/use-streaks'

type Tab = 'todos' | 'routines'

function getCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0
  return completed / total
}

function getCellColor(rate: number, total: number): string {
  if (total === 0) return 'bg-muted/40'
  if (rate === 0) return 'bg-muted/60'
  if (rate < 0.25) return 'bg-green-200 dark:bg-green-900'
  if (rate < 0.5) return 'bg-green-300 dark:bg-green-700'
  if (rate < 0.75) return 'bg-green-500 dark:bg-green-500'
  if (rate < 1) return 'bg-green-600 dark:bg-green-400'
  return 'bg-green-700 dark:bg-green-300'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type HeatmapGridProps = {
  entries: HeatmapEntry[]
}

function HeatmapGrid({ entries }: HeatmapGridProps) {
  // 90일을 주 단위로 나누기 (7행 x 13열 정도)
  // 첫 날의 요일에 맞게 패딩 추가
  const firstDate = entries[0] ? new Date(entries[0].date + 'T00:00:00') : new Date()
  const firstDayOfWeek = firstDate.getDay() // 0=일요일

  // 앞에 빈 칸 패딩
  const paddedEntries: (HeatmapEntry | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...entries,
  ]

  // 주 단위로 그루핑
  const weeks: (HeatmapEntry | null)[][] = []
  for (let i = 0; i < paddedEntries.length; i += 7) {
    weeks.push(paddedEntries.slice(i, i + 7))
  }

  // 마지막 주 패딩
  const lastWeek = weeks[weeks.length - 1]
  if (lastWeek && lastWeek.length < 7) {
    while (lastWeek.length < 7) {
      lastWeek.push(null)
    }
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 min-w-0">
        {/* 요일 레이블 */}
        <div className="flex flex-col gap-1 mr-1">
          <div className="w-3 h-3" /> {/* 헤더 공간 */}
          {dayLabels.map((label, i) => (
            <div
              key={i}
              className="w-3 h-3 flex items-center justify-center text-[8px] text-muted-foreground leading-none"
            >
              {i % 2 === 0 ? label : ''}
            </div>
          ))}
        </div>

        {/* 주별 열 */}
        {weeks.map((week, weekIdx) => {
          // 이 주의 월 레이블 (첫 날 기준)
          const firstCell = week.find((c) => c !== null)
          let monthLabel = ''
          if (firstCell && weekIdx === 0) {
            const d = new Date(firstCell.date + 'T00:00:00')
            monthLabel = String(d.getMonth() + 1) + '월'
          } else if (firstCell) {
            const d = new Date(firstCell.date + 'T00:00:00')
            if (d.getDate() <= 7) {
              monthLabel = String(d.getMonth() + 1) + '월'
            }
          }

          return (
            <div key={weekIdx} className="flex flex-col gap-1">
              {/* 월 레이블 */}
              <div className="h-3 flex items-center justify-center text-[8px] text-muted-foreground leading-none whitespace-nowrap">
                {monthLabel}
              </div>
              {/* 7일 칸 */}
              {week.map((cell, dayIdx) => {
                if (cell === null) {
                  return <div key={dayIdx} className="w-3 h-3" />
                }
                const rate = getCompletionRate(cell.completed, cell.total)
                const colorClass = getCellColor(rate, cell.total)
                const tooltipText = `${formatDate(cell.date)}: ${cell.completed}/${cell.total}`
                return (
                  <div
                    key={dayIdx}
                    className={`w-3 h-3 rounded-sm ${colorClass} cursor-default transition-opacity hover:opacity-80`}
                    title={tooltipText}
                    aria-label={tooltipText}
                  />
                )
              })}
            </div>
          )
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
        <span>0%</span>
        <div className="w-3 h-3 rounded-sm bg-muted/60" />
        <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
        <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700" />
        <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-500" />
        <div className="w-3 h-3 rounded-sm bg-green-700 dark:bg-green-300" />
        <span>100%</span>
      </div>
    </div>
  )
}

type Props = {
  todoEntries: HeatmapEntry[]
  routineEntries: HeatmapEntry[]
}

export function ActivityHeatmap({ todoEntries, routineEntries }: Props) {
  const t = useTranslations('streaks')
  const [activeTab, setActiveTab] = useState<Tab>('todos')

  const entries = activeTab === 'todos' ? todoEntries : routineEntries

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('heatmap_title')}</CardTitle>
        {/* 탭 */}
        <div className="flex gap-2 mt-1">
          <button
            onClick={() => setActiveTab('todos')}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              activeTab === 'todos'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('heatmap_todos')}
          </button>
          <button
            onClick={() => setActiveTab('routines')}
            className={`text-sm px-3 py-1 rounded-md transition-colors ${
              activeTab === 'routines'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t('heatmap_routines')}
          </button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <HeatmapGrid entries={entries} />
      </CardContent>
    </Card>
  )
}
