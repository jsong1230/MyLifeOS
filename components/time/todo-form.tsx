'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Todo, CreateTodoInput, UpdateTodoInput, TodoPriority } from '@/types/todo'

interface TodoFormProps {
  todo?: Todo
  onSubmit: (data: CreateTodoInput | UpdateTodoInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 할일 생성/수정 폼 컴포넌트
export function TodoForm({ todo, onSubmit, onCancel, isLoading = false }: TodoFormProps) {
  const t = useTranslations('time.todos')
  const tCommon = useTranslations('common')
  const [title, setTitle] = useState(todo?.title ?? '')
  const [dueDate, setDueDate] = useState(todo?.due_date ?? '')
  const [priority, setPriority] = useState<TodoPriority>(todo?.priority ?? 'medium')
  const [category, setCategory] = useState(todo?.category ?? '')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const data: CreateTodoInput | UpdateTodoInput = {
      title: title.trim(),
      due_date: dueDate || undefined,
      priority,
      category: category.trim() || undefined,
    }

    onSubmit(data)
  }

  const isEditMode = Boolean(todo)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? t('editTitle') : t('addTitle')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* 제목 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="todo-title">
              {t('titleLabel')} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="todo-title"
              type="text"
              placeholder={t('titlePlaceholder')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
              maxLength={200}
            />
          </div>

          {/* 마감일 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="todo-due-date">{t('dueDate')}</Label>
            <Input
              id="todo-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* 우선순위 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="todo-priority">{t('priority')}</Label>
            <Select
              value={priority}
              onValueChange={(value) => setPriority(value as TodoPriority)}
              disabled={isLoading}
            >
              <SelectTrigger id="todo-priority">
                <SelectValue placeholder={t('priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">{t('priorities.high')}</SelectItem>
                <SelectItem value="medium">{t('priorities.medium')}</SelectItem>
                <SelectItem value="low">{t('priorities.low')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 카테고리 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="todo-category">{tCommon('category')}</Label>
            <Input
              id="todo-category"
              type="text"
              placeholder={`${tCommon('category')} (${tCommon('optional')})`}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
              maxLength={50}
            />
          </div>

          {/* 버튼 영역 */}
          <div className="flex gap-2 justify-end pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                {tCommon('cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isLoading || title.trim() === ''}>
              {isLoading ? tCommon('saving') : isEditMode ? tCommon('update') : tCommon('add')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
