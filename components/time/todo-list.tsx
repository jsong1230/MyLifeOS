'use client'

import { useTranslations } from 'next-intl'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { TodoItem } from './todo-item'
import type { Todo, ReorderTodoInput } from '@/types/todo'

interface TodoListProps {
  todos: Todo[]
  onToggle: (id: string) => void
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  onReorder: (items: ReorderTodoInput[]) => void
}

// 할일 목록 컴포넌트 — DnD Sortable 지원
export function TodoList({ todos, onToggle, onEdit, onDelete, onReorder }: TodoListProps) {
  const t = useTranslations('time.todos')
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이상 움직여야 드래그 시작
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // 드래그 종료 후 새 순서 계산 및 onReorder 호출
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = todos.findIndex((todo) => todo.id === active.id)
    const newIndex = todos.findIndex((todo) => todo.id === over.id)

    if (oldIndex === -1 || newIndex === -1) return

    const reorderedTodos = arrayMove(todos, oldIndex, newIndex)

    // 새 sort_order 값 계산 (0부터 순서대로)
    const reorderItems: ReorderTodoInput[] = reorderedTodos.map((todo, index) => ({
      id: todo.id,
      sort_order: index,
    }))

    onReorder(reorderItems)
  }

  // 빈 상태
  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">{t('noData')}</p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          {t('addFirstHint')}
        </p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={todos.map((todo) => todo.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
