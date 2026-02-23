'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Pencil, Trash2, PauseCircle, PlayCircle } from 'lucide-react'
import type { Routine, RoutineWithLog } from '@/types/routine'

// 요일 레이블 (0=일, 1=월, ..., 6=토)
const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

/**
 * 루틴 반복 주기 텍스트 생성
 */
function getFrequencyLabel(routine: Routine): string {
  if (routine.frequency === 'daily') {
    return '매일'
  }

  if (routine.frequency === 'weekly') {
    if (!routine.days_of_week || routine.days_of_week.length === 0) {
      return '매주'
    }
    const dayNames = routine.days_of_week.map((d) => DAY_LABELS[d]).join('/')
    return `매주 ${dayNames}`
  }

  if (routine.frequency === 'custom') {
    const days = routine.interval_days ?? 0
    return `${days}일마다`
  }

  return ''
}

interface RoutineItemProps {
  routine: RoutineWithLog
  onToggle: (routineId: string, date: string, completed: boolean) => void
  onEdit: (routine: Routine) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, isActive: boolean) => void
}

/**
 * 개별 루틴 아이템 컴포넌트
 * - 체크박스로 오늘 완료 여부 토글
 * - streak 배지 (1 이상일 때만)
 * - 일시정지/재개 토글
 * - 수정/삭제 버튼
 */
export function RoutineItem({
  routine,
  onToggle,
  onEdit,
  onDelete,
  onToggleActive,
}: RoutineItemProps) {
  const isCompleted = routine.log?.completed ?? false
  const today = new Date().toISOString().split('T')[0]

  function handleCheckboxChange(checked: boolean | 'indeterminate') {
    if (checked === 'indeterminate') return
    onToggle(routine.id, today, checked)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 transition-opacity',
        !routine.is_active && 'opacity-50'
      )}
    >
      {/* 체크박스 */}
      <Checkbox
        id={`routine-${routine.id}`}
        checked={isCompleted}
        onCheckedChange={handleCheckboxChange}
        disabled={!routine.is_active}
        aria-label={`${routine.title} 완료 체크`}
      />

      {/* 루틴 정보 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <label
            htmlFor={`routine-${routine.id}`}
            className={cn(
              'text-sm font-medium cursor-pointer select-none',
              isCompleted && 'line-through text-muted-foreground'
            )}
          >
            {routine.title}
          </label>

          {/* Streak 배지 — 1 이상일 때만 표시 */}
          {routine.streak >= 1 && (
            <Badge variant="secondary" className="text-xs gap-1">
              <span aria-hidden>🔥</span>
              {routine.streak}일 연속
            </Badge>
          )}
        </div>

        {/* 빈도 + 시간 */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">
            {getFrequencyLabel(routine)}
          </span>
          {routine.time_of_day && (
            <>
              <span className="text-xs text-muted-foreground" aria-hidden>·</span>
              <span className="text-xs text-muted-foreground">
                {routine.time_of_day}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 shrink-0">
        {/* 일시정지 / 재개 토글 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onToggleActive(routine.id, !routine.is_active)}
          aria-label={routine.is_active ? '루틴 일시정지' : '루틴 재개'}
          title={routine.is_active ? '일시정지' : '재개'}
        >
          {routine.is_active ? (
            <PauseCircle className="size-4 text-muted-foreground" />
          ) : (
            <PlayCircle className="size-4 text-muted-foreground" />
          )}
        </Button>

        {/* 수정 버튼 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(routine)}
          aria-label="루틴 수정"
          title="수정"
        >
          <Pencil className="size-4 text-muted-foreground" />
        </Button>

        {/* 삭제 버튼 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(routine.id)}
          aria-label="루틴 삭제"
          title="삭제"
        >
          <Trash2 className="size-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  )
}
