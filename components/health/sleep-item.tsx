'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SleepLog } from '@/types/health'

// 수면 시간에 따른 색상 클래스 반환
// 7h+ = 초록, 5-7h = 주황, 5h 미만 = 빨강
function getSleepHoursColor(hours: number): string {
  if (hours >= 7) return 'text-green-600 dark:text-green-400'
  if (hours >= 5) return 'text-orange-500 dark:text-orange-400'
  return 'text-red-500 dark:text-red-400'
}

// 수면 시간 배지 variant 반환
function getSleepBadgeVariant(hours: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (hours >= 7) return 'default'
  if (hours >= 5) return 'secondary'
  return 'destructive'
}

// 수면 시간 포맷 (예: 7.5 → "7시간 30분")
function formatSleepHours(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

// 날짜 포맷 (YYYY-MM-DD → M월 D일 (요일))
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`
}

interface SleepItemProps {
  sleep: SleepLog
  onEdit: (sleep: SleepLog) => void
  onDelete: (id: string) => void
}

// 수면 기록 아이템 컴포넌트 — 취침/기상 시각, 수면 시간, 수면 질 별점 표시
export function SleepItem({ sleep, onEdit, onDelete }: SleepItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
      {/* 수면 아이콘 */}
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mt-0.5">
        <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
      </div>

      {/* 수면 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {/* 수면 시간 */}
          <span className={cn('font-semibold text-base', getSleepHoursColor(sleep.value))}>
            {formatSleepHours(sleep.value)}
          </span>

          {/* 수면 시간 배지 */}
          <Badge variant={getSleepBadgeVariant(sleep.value)} className="text-xs">
            {sleep.value}h
          </Badge>

          {/* 수면 질 별점 */}
          {sleep.value2 != null && (
            <span className="text-yellow-400 text-sm" title={`수면 질: ${sleep.value2}/5`}>
              {'★'.repeat(sleep.value2)}
              {'☆'.repeat(5 - sleep.value2)}
            </span>
          )}
        </div>

        {/* 취침~기상 시각 */}
        {sleep.time_start && sleep.time_end && (
          <div className="flex items-center gap-1 mt-0.5 text-sm text-muted-foreground">
            <Moon className="w-3 h-3" />
            <span>{sleep.time_start}</span>
            <span>→</span>
            <Sun className="w-3 h-3" />
            <span>{sleep.time_end}</span>
          </div>
        )}

        {/* 날짜 */}
        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(sleep.date)}</p>

        {/* 메모 */}
        {sleep.note && (
          <p className="text-sm text-muted-foreground mt-1 truncate">{sleep.note}</p>
        )}
      </div>

      {/* 편집/삭제 버튼 */}
      <div className="flex-shrink-0 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(sleep)}
          aria-label="수면 기록 수정"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(sleep.id)}
          aria-label="수면 기록 삭제"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
