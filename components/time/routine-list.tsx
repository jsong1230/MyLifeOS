'use client'

import { RoutineItem } from '@/components/time/routine-item'
import { Separator } from '@/components/ui/separator'
import type { Routine, RoutineWithLog } from '@/types/routine'

interface RoutineListProps {
  routines: RoutineWithLog[]
  onToggle: (routineId: string, date: string, completed: boolean) => void
  onEdit: (routine: Routine) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, isActive: boolean) => void
}

/**
 * 오늘의 루틴 목록 컴포넌트
 * - 미완료 / 완료 섹션으로 구분
 * - 루틴이 없을 때 안내 메시지 표시
 */
export function RoutineList({
  routines,
  onToggle,
  onEdit,
  onDelete,
  onToggleActive,
}: RoutineListProps) {
  // 완료/미완료 분리
  const pending = routines.filter((r) => !r.log?.completed)
  const completed = routines.filter((r) => r.log?.completed)

  // 루틴 없음 상태
  if (routines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground text-sm">
          오늘 예정된 루틴이 없습니다.
        </p>
        <p className="text-muted-foreground text-xs mt-1">
          + 루틴 추가 버튼을 눌러 새 루틴을 만들어보세요
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 미완료 루틴 */}
      {pending.length > 0 && (
        <section aria-label="미완료 루틴">
          <div className="space-y-2">
            {pending.map((routine) => (
              <RoutineItem
                key={routine.id}
                routine={routine}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
              />
            ))}
          </div>
        </section>
      )}

      {/* 구분선 — 두 섹션 모두 있을 때만 표시 */}
      {pending.length > 0 && completed.length > 0 && (
        <div className="flex items-center gap-2">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground shrink-0">완료됨</span>
          <Separator className="flex-1" />
        </div>
      )}

      {/* 완료 루틴 */}
      {completed.length > 0 && (
        <section aria-label="완료 루틴">
          <div className="space-y-2">
            {completed.map((routine) => (
              <RoutineItem
                key={routine.id}
                routine={routine}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
