'use client'

import { useState, useMemo } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { CalendarView } from '@/components/time/calendar-view'
import { TodoFormDialog } from '@/components/time/todo-form-dialog'
import { useTodos } from '@/hooks/use-todos'
import { useCalendar } from '@/hooks/use-calendar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Plus, Check, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Todo } from '@/types/todo'

// 캘린더 페이지 — 월간/주간/일간 캘린더 + 선택 날짜 상세 패널
export default function CalendarPage() {
  const locale = useLocale()
  const { selectedDate, setSelectedDate, monthQuery } = useCalendar()

  // 선택된 날짜로 TodoFormDialog 열기 여부
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogDefaultDate, setDialogDefaultDate] = useState<string>('')

  // 해당 월 전체 할일 조회
  const { data: todos = [], isLoading, isError } = useTodos({ month: monthQuery })

  // 선택된 날짜의 할일 필터링
  const selectedDateTodos = useMemo(
    () => todos.filter((t) => t.due_date === selectedDate),
    [todos, selectedDate]
  )

  // 날짜 선택 핸들러
  function handleSelectDate(date: string) {
    setSelectedDate(date)
  }

  // 할일 추가 핸들러 (날짜 미리 설정)
  function handleAddTodo(date: string) {
    setDialogDefaultDate(date)
    setDialogOpen(true)
  }

  return (
    <div className="h-full lg:grid lg:grid-cols-[1fr_300px]">
      {/* 캘린더 영역 */}
      <div className="flex flex-col min-h-0">
        {isLoading ? (
          <CalendarSkeleton />
        ) : isError ? (
          <CalendarError />
        ) : (
          <CalendarView
            todos={todos}
            onAddTodo={handleAddTodo}
            onSelectDate={handleSelectDate}
          />
        )}
      </div>

      {/* 선택 날짜 상세 패널 (모바일: 하단, 데스크탑: 우측) */}
      <div className="lg:border-l bg-background">
        <SelectedDatePanel
          date={selectedDate}
          todos={selectedDateTodos}
          onAddTodo={() => handleAddTodo(selectedDate)}
          locale={locale}
        />
      </div>

      {/* 할일 추가 다이얼로그 */}
      <TodoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={dialogDefaultDate}
      />
    </div>
  )
}

// 선택된 날짜 상세 패널 컴포넌트
interface SelectedDatePanelProps {
  date: string
  todos: Todo[]
  onAddTodo: () => void
  locale: string
}

function SelectedDatePanel({ date, todos, onAddTodo, locale }: SelectedDatePanelProps) {
  const t = useTranslations('time.calendar')
  const tc = useTranslations('common')

  // 날짜 표시 포맷 (로케일 기반)
  const dateObj = new Date(date + 'T00:00:00')
  const dateLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(dateObj)

  const completedCount = todos.filter((td) => td.status === 'completed').length
  const pendingCount = todos.filter((td) => td.status === 'pending').length

  return (
    <div className="flex flex-col h-full">
      {/* 패널 헤더 */}
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{dateLabel}</span>
          {todos.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {t('summary', { total: todos.length, completed: completedCount, pending: pendingCount })}
            </span>
          )}
        </div>
        <Button size="sm" variant="outline" onClick={onAddTodo} className="gap-1 text-xs">
          <Plus className="h-3.5 w-3.5" />
          {tc('add')}
        </Button>
      </div>

      {/* 할일 목록 */}
      <div className="flex-1 overflow-auto p-4">
        {todos.length === 0 ? (
          <EmptyDateState onAddTodo={onAddTodo} />
        ) : (
          <div className="flex flex-col gap-2">
            {todos.map((todo, index) => (
              <div key={todo.id}>
                <PanelTodoItem todo={todo} />
                {index < todos.length - 1 && <Separator className="mt-2" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// 빈 날짜 상태 컴포넌트
function EmptyDateState({ onAddTodo }: { onAddTodo: () => void }) {
  const t = useTranslations('time.calendar')
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 py-12 text-muted-foreground">
      <Calendar className="h-8 w-8 opacity-30" />
      <p className="text-sm text-center">{t('noTodosEmpty')}</p>
      <Button size="sm" variant="outline" onClick={onAddTodo} className="gap-1 text-xs">
        <Plus className="h-3.5 w-3.5" />
        {t('addTodoHere')}
      </Button>
    </div>
  )
}

// 패널 내 할일 아이템 컴포넌트
function PanelTodoItem({ todo }: { todo: Todo }) {
  const tp = useTranslations('time.todos.priorities')
  const today = new Date().toISOString().split('T')[0]
  const isOverdue =
    todo.status !== 'completed' &&
    todo.due_date !== null &&
    todo.due_date !== undefined &&
    todo.due_date < today

  const PRIORITY_CONFIG = {
    high: { label: tp('high'), className: 'bg-red-100 text-red-700' },
    medium: { label: tp('medium'), className: 'bg-yellow-100 text-yellow-700' },
    low: { label: tp('low'), className: 'bg-gray-100 text-gray-600' },
  }

  const { label: priorityLabel, className: priorityClassName } =
    PRIORITY_CONFIG[todo.priority]

  return (
    <div className="flex items-start gap-2.5 py-1">
      {/* 완료 아이콘 */}
      <div
        className={cn(
          'mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
          todo.status === 'completed'
            ? 'bg-green-500 border-green-500'
            : 'border-muted-foreground'
        )}
      >
        {todo.status === 'completed' && (
          <Check className="h-2.5 w-2.5 text-white" />
        )}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium leading-snug',
            todo.status === 'completed' && 'line-through text-muted-foreground',
            isOverdue && 'text-red-600'
          )}
        >
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {todo.description}
          </p>
        )}
        {todo.category && (
          <span className="text-xs text-muted-foreground mt-0.5 inline-block">
            #{todo.category}
          </span>
        )}
      </div>

      {/* 우선순위 배지 */}
      <Badge
        variant="outline"
        className={cn('text-xs border-0 px-1.5 py-0 font-normal flex-shrink-0', priorityClassName)}
      >
        {priorityLabel}
      </Badge>
    </div>
  )
}

// 로딩 스켈레톤
function CalendarSkeleton() {
  return (
    <div className="p-4 flex flex-col gap-4 animate-pulse">
      {/* 컨트롤 바 스켈레톤 */}
      <div className="flex items-center justify-between">
        <div className="h-6 w-32 rounded bg-muted" />
        <div className="h-8 w-20 rounded bg-muted" />
      </div>
      {/* 요일 헤더 스켈레톤 */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-5 rounded bg-muted" />
        ))}
      </div>
      {/* 날짜 그리드 스켈레톤 */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-16 rounded bg-muted" />
        ))}
      </div>
    </div>
  )
}

// 에러 상태
function CalendarError() {
  const t = useTranslations('time.calendar')
  return (
    <div className="flex items-center justify-center h-full py-16">
      <p className="text-sm text-muted-foreground">
        {t('loadError')}
      </p>
    </div>
  )
}
