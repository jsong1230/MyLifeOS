'use client'

import { useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  useCalendar,
  type CalendarView,
  type CalendarDay,
} from '@/hooks/use-calendar'
import type { Todo } from '@/types/todo'

// 할일 상태에 따른 배지 색상
function getTodoBadgeVariant(todo: Todo): string {
  if (todo.status === 'completed') return 'bg-green-100 text-green-700'
  if (todo.due_date && todo.due_date < new Date().toISOString().split('T')[0]) {
    return 'bg-red-100 text-red-700'
  }
  return 'bg-blue-100 text-blue-700'
}

interface CalendarViewProps {
  todos: Todo[]
  onAddTodo?: (date: string) => void
  onSelectDate?: (date: string) => void
}

// 캘린더 메인 컴포넌트
export function CalendarView({ todos, onAddTodo, onSelectDate }: CalendarViewProps) {
  const t = useTranslations('time.calendar')
  const tTodos = useTranslations('time.todos')
  const tCommon = useTranslations('common')

  const {
    selectedDate,
    setSelectedDate,
    view,
    setView,
    prevMonth,
    nextMonth,
    goToToday,
    monthDays,
    weekDays,
    monthLabel,
  } = useCalendar()

  // 뷰 탭 설정 (번역 포함)
  const viewTabs: { value: CalendarView; label: string }[] = [
    { value: 'month', label: t('monthView') },
    { value: 'week', label: t('weekView') },
    { value: 'day', label: t('dayView') },
  ]

  // 날짜별 할일 맵 생성 (O(n) 전처리)
  const todosByDate = useCallback(
    (date: string) => todos.filter((todo) => todo.due_date === date),
    [todos]
  )

  // 날짜 선택 핸들러
  function handleDateClick(date: string) {
    setSelectedDate(date)
    onSelectDate?.(date)
  }

  // 할일 추가 핸들러
  function handleAddTodo() {
    onAddTodo?.(selectedDate)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 상단 컨트롤 영역 */}
      <div className="flex flex-col gap-3 px-4 py-3 border-b bg-background">
        {/* 월 네비게이션 + 오늘 버튼 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={prevMonth}
              aria-label={t('prevMonth')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-base font-semibold min-w-[120px] text-center">
              {monthLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={nextMonth}
              aria-label={t('nextMonth')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-xs"
            >
              {t('today')}
            </Button>
            <Button
              size="sm"
              onClick={handleAddTodo}
              className="text-xs gap-1"
              aria-label={tTodos('add')}
            >
              <Plus className="h-3.5 w-3.5" />
              {tCommon('add')}
            </Button>
          </div>
        </div>

        {/* 뷰 전환 탭 */}
        <div className="flex rounded-lg border bg-muted p-1 self-start">
          {viewTabs.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setView(value)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                view === value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              aria-pressed={view === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 캘린더 본문 */}
      <div className="flex-1 overflow-auto">
        {view === 'month' && (
          <MonthView
            days={monthDays}
            todosByDate={todosByDate}
            onDateClick={handleDateClick}
          />
        )}
        {view === 'week' && (
          <WeekView
            days={weekDays}
            todosByDate={todosByDate}
            onDateClick={handleDateClick}
          />
        )}
        {view === 'day' && (
          <DayView
            date={selectedDate}
            todos={todosByDate(selectedDate)}
            onAddTodo={() => handleAddTodo()}
          />
        )}
      </div>
    </div>
  )
}

// 월간 뷰 컴포넌트
interface MonthViewProps {
  days: CalendarDay[]
  todosByDate: (date: string) => Todo[]
  onDateClick: (date: string) => void
}

function MonthView({ days, todosByDate, onDateClick }: MonthViewProps) {
  const t = useTranslations('time.calendar')
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

  return (
    <div className="p-2">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {dayKeys.map((key, idx) => (
          <div
            key={key}
            className={cn(
              'text-center text-xs font-medium py-2',
              idx === 0 && 'text-red-500',
              idx === 6 && 'text-blue-500',
              idx > 0 && idx < 6 && 'text-muted-foreground'
            )}
          >
            {t(`weekdays.${key}`)}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {days.map((day) => {
          const dayTodos = todosByDate(day.date)
          const dayNum = parseInt(day.date.split('-')[2], 10)
          const dayOfWeek = new Date(day.date + 'T00:00:00').getDay()
          const visibleTodos = dayTodos.slice(0, 2)
          const extraCount = dayTodos.length - 2

          return (
            <button
              key={day.date}
              onClick={() => onDateClick(day.date)}
              className={cn(
                'bg-background min-h-[80px] p-1 text-left flex flex-col gap-0.5',
                'hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-inset',
                !day.isCurrentMonth && 'opacity-40',
                day.isSelected && !day.isToday && 'bg-accent'
              )}
              aria-label={day.date}
              aria-pressed={day.isSelected}
            >
              {/* 날짜 숫자 */}
              <span
                className={cn(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                  day.isToday && 'bg-primary text-primary-foreground',
                  !day.isToday && dayOfWeek === 0 && 'text-red-500',
                  !day.isToday && dayOfWeek === 6 && 'text-blue-500',
                  day.isSelected && !day.isToday && 'ring-2 ring-primary'
                )}
              >
                {dayNum}
              </span>

              {/* 할일 미리보기 */}
              <div className="flex flex-col gap-0.5 w-full">
                {visibleTodos.map((todo) => (
                  <span
                    key={todo.id}
                    className={cn(
                      'text-xs px-1 rounded truncate w-full',
                      getTodoBadgeVariant(todo)
                    )}
                    title={todo.title}
                  >
                    {todo.title}
                  </span>
                ))}
                {extraCount > 0 && (
                  <span className="text-xs text-muted-foreground px-1">
                    {t('moreItems', { n: extraCount })}
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 주간 뷰 컴포넌트
interface WeekViewProps {
  days: CalendarDay[]
  todosByDate: (date: string) => Todo[]
  onDateClick: (date: string) => void
}

function WeekView({ days, todosByDate, onDateClick }: WeekViewProps) {
  const t = useTranslations('time.calendar')
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

  return (
    <div className="p-4">
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, idx) => {
          const dayTodos = todosByDate(day.date)
          const [, , dayPart] = day.date.split('-')

          return (
            <div key={day.date} className="flex flex-col gap-2">
              {/* 요일 + 날짜 헤더 */}
              <button
                onClick={() => onDateClick(day.date)}
                className="flex flex-col items-center gap-1 focus:outline-none"
                aria-label={day.date}
              >
                <span
                  className={cn(
                    'text-xs font-medium',
                    idx === 0 && 'text-red-500',
                    idx === 6 && 'text-blue-500',
                    idx > 0 && idx < 6 && 'text-muted-foreground'
                  )}
                >
                  {t(`weekdays.${dayKeys[idx]}`)}
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full',
                    day.isToday && 'bg-primary text-primary-foreground',
                    day.isSelected && !day.isToday && 'ring-2 ring-primary',
                    !day.isCurrentMonth && 'opacity-50'
                  )}
                >
                  {parseInt(dayPart, 10)}
                </span>
              </button>

              {/* 해당일 할일 목록 */}
              <div className="flex flex-col gap-1 min-h-[120px]">
                {dayTodos.length === 0 ? (
                  <div className="h-full" />
                ) : (
                  dayTodos.map((todo) => (
                    <span
                      key={todo.id}
                      className={cn(
                        'text-xs px-1.5 py-0.5 rounded truncate',
                        getTodoBadgeVariant(todo)
                      )}
                      title={todo.title}
                    >
                      {todo.title}
                    </span>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 일간 뷰 컴포넌트
interface DayViewProps {
  date: string
  todos: Todo[]
  onAddTodo: () => void
}

function DayView({ date, todos, onAddTodo }: DayViewProps) {
  const t = useTranslations('time.calendar')
  const tTodos = useTranslations('time.todos')
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

  // 날짜 표시 포맷 (예: 2026년 2월 23일 월요일)
  const dateObj = new Date(date + 'T00:00:00')
  const dayLabel = t(`weekdays.${dayKeys[dateObj.getDay()]}`)
  const dateLabel = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일 ${dayLabel}요일`

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* 날짜 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{dateLabel}</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddTodo}
          className="gap-1 text-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          {tTodos('add')}
        </Button>
      </div>

      {/* 할일 목록 */}
      {todos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <Calendar className="h-10 w-10 opacity-30" />
          <p className="text-sm">{t('noTodosForDay')}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={onAddTodo}
            className="gap-1 text-xs mt-1"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('addTodo')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {todos.map((todo) => (
            <DayTodoItem key={todo.id} todo={todo} />
          ))}
        </div>
      )}
    </div>
  )
}

// 일간 뷰 할일 아이템 컴포넌트
function DayTodoItem({ todo }: { todo: Todo }) {
  const isOverdue =
    todo.status !== 'completed' &&
    todo.due_date !== null &&
    todo.due_date !== undefined &&
    todo.due_date < new Date().toISOString().split('T')[0]

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        todo.status === 'completed' && 'opacity-60 bg-muted/50',
        isOverdue && 'border-red-200 bg-red-50'
      )}
    >
      {/* 완료 상태 표시 */}
      <div
        className={cn(
          'mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0',
          todo.status === 'completed'
            ? 'bg-green-500 border-green-500'
            : 'border-muted-foreground'
        )}
      />

      {/* 할일 내용 */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            todo.status === 'completed' && 'line-through text-muted-foreground'
          )}
        >
          {todo.title}
        </p>
        {todo.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {todo.description}
          </p>
        )}
      </div>

      {/* 우선순위 배지 */}
      <PriorityBadge priority={todo.priority} />
    </div>
  )
}

// 우선순위 배지 컴포넌트
function PriorityBadge({ priority }: { priority: Todo['priority'] }) {
  const t = useTranslations('time.todos')
  const config = {
    high: { className: 'bg-red-100 text-red-700' },
    medium: { className: 'bg-yellow-100 text-yellow-700' },
    low: { className: 'bg-gray-100 text-gray-600' },
  }
  const { className } = config[priority]

  return (
    <Badge
      variant="outline"
      className={cn('text-xs border-0 px-1.5 py-0 font-normal', className)}
    >
      {t(`priorities.${priority}`)}
    </Badge>
  )
}
