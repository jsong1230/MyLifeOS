'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { Todo } from '@/types/todo'

interface TodoItemProps {
  todo: Todo
  onToggle: (id: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  isDragging?: boolean
}

// 우선순위 배지 색상 매핑
const PRIORITY_BADGE_CLASS: Record<string, string> = {
  high: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
  low: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400',
}

const PRIORITY_LABEL: Record<string, string> = {
  high: '높음',
  medium: '중간',
  low: '낮음',
}

// 마감일이 오늘보다 이전인지 확인
function isOverdue(dueDate: string | null | undefined): boolean {
  if (!dueDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  return due < today
}

// 날짜 포맷 (YYYY-MM-DD → MM/DD)
function formatDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${month}/${day}`
}

// 할일 항목 컴포넌트 — 드래그 앤 드롭 지원
export function TodoItem({ todo, onToggle, onEdit, onDelete, isDragging = false }: TodoItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const isCompleted = todo.status === 'completed'
  const overdue = isOverdue(todo.due_date) && !isCompleted

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 rounded-lg border bg-background p-3 shadow-xs transition-shadow',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-md ring-2 ring-primary/20',
        isCompleted && 'opacity-60'
      )}
    >
      {/* 드래그 핸들 */}
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground active:cursor-grabbing shrink-0"
        aria-label="드래그하여 순서 변경"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>

      {/* 체크박스 */}
      <Checkbox
        id={`todo-check-${todo.id}`}
        checked={isCompleted}
        onCheckedChange={() => onToggle(todo.id)}
        aria-label={`${todo.title} 완료 토글`}
        className="shrink-0"
      />

      {/* 콘텐츠 영역 */}
      <div className="flex flex-1 flex-col gap-1 min-w-0">
        {/* 제목 */}
        <span
          className={cn(
            'text-sm font-medium leading-tight truncate',
            isCompleted && 'line-through text-muted-foreground'
          )}
        >
          {todo.title}
        </span>

        {/* 메타 정보 */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 우선순위 배지 */}
          <Badge
            variant="outline"
            className={cn('text-xs px-1.5 py-0', PRIORITY_BADGE_CLASS[todo.priority])}
          >
            {PRIORITY_LABEL[todo.priority]}
          </Badge>

          {/* 마감일 */}
          {todo.due_date && (
            <span
              className={cn(
                'text-xs',
                overdue ? 'text-red-500 font-medium' : 'text-muted-foreground'
              )}
            >
              {overdue && '! '}
              {formatDate(todo.due_date)}
            </span>
          )}

          {/* 카테고리 */}
          {todo.category && (
            <span className="text-xs text-muted-foreground truncate">
              #{todo.category}
            </span>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onEdit(todo)}
          aria-label={`${todo.title} 수정`}
          className="text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(todo.id)}
          aria-label={`${todo.title} 삭제`}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
