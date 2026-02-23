'use client'

import { useState, type FormEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateTodo } from '@/hooks/use-todos'
import type { TodoPriority, CreateTodoInput } from '@/types/todo'

interface TodoFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  // 미리 설정된 날짜 (캘린더에서 날짜 선택 후 열 때 사용)
  defaultDate?: string
  onSuccess?: () => void
}

const PRIORITY_OPTIONS: { value: TodoPriority; label: string }[] = [
  { value: 'high', label: '높음' },
  { value: 'medium', label: '중간' },
  { value: 'low', label: '낮음' },
]

// 할일 생성 폼 다이얼로그
export function TodoFormDialog({
  open,
  onOpenChange,
  defaultDate,
  onSuccess,
}: TodoFormDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(defaultDate ?? '')
  const [priority, setPriority] = useState<TodoPriority>('medium')
  const [category, setCategory] = useState('')
  const [titleError, setTitleError] = useState('')

  const { mutateAsync: createTodo, isPending } = useCreateTodo()

  // defaultDate 변경 시 날짜 필드 동기화
  // (open 상태 변경 시에도 defaultDate 반영)
  function resetForm(newDefaultDate?: string) {
    setTitle('')
    setDescription('')
    setDueDate(newDefaultDate ?? '')
    setPriority('medium')
    setCategory('')
    setTitleError('')
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      resetForm(defaultDate)
    }
    onOpenChange(nextOpen)
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // 제목 유효성 검사
    if (!title.trim()) {
      setTitleError('제목을 입력해 주세요')
      return
    }

    const input: CreateTodoInput = {
      title: title.trim(),
      ...(description.trim() && { description: description.trim() }),
      ...(dueDate && { due_date: dueDate }),
      priority,
      ...(category.trim() && { category: category.trim() }),
    }

    try {
      await createTodo(input)
      resetForm(defaultDate)
      onOpenChange(false)
      onSuccess?.()
    } catch {
      // 에러는 React Query가 관리
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 할일 추가</DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          {/* 제목 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="todo-title">
              제목 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="todo-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (e.target.value.trim()) setTitleError('')
              }}
              placeholder="할일을 입력하세요"
              aria-invalid={!!titleError}
              aria-describedby={titleError ? 'todo-title-error' : undefined}
              autoFocus
            />
            {titleError && (
              <p id="todo-title-error" className="text-xs text-destructive">
                {titleError}
              </p>
            )}
          </div>

          {/* 설명 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="todo-description">설명 (선택)</Label>
            <Input
              id="todo-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="세부 내용을 입력하세요"
            />
          </div>

          {/* 날짜 + 우선순위 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="todo-due-date">마감일</Label>
              <Input
                id="todo-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="todo-priority">우선순위</Label>
              <select
                id="todo-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TodoPriority)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {PRIORITY_OPTIONS.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 카테고리 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="todo-category">카테고리 (선택)</Label>
            <Input
              id="todo-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="예: 업무, 개인, 쇼핑"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
