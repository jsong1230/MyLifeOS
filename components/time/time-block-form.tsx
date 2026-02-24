'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
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
import type { TimeBlock, CreateTimeBlockInput, UpdateTimeBlockInput } from '@/types/time-block'
import type { Todo } from '@/types/todo'

// 색상 프리셋 — HEX 값과 번역 키
const COLOR_PRESET_VALUES = [
  { value: '#3b82f6', labelKey: 'colorBlue' },
  { value: '#22c55e', labelKey: 'colorGreen' },
  { value: '#f59e0b', labelKey: 'colorOrange' },
  { value: '#ef4444', labelKey: 'colorRed' },
  { value: '#a855f7', labelKey: 'colorPurple' },
  { value: '#ec4899', labelKey: 'colorPink' },
] as const

interface TimeBlockFormProps {
  // 수정 모드: 기존 블록 데이터
  block?: TimeBlock
  // 기본 날짜 (페이지에서 선택된 날짜)
  defaultDate?: string
  // 오늘 할일 목록 (연결 선택용)
  todos?: Todo[]
  onSubmit: (data: CreateTimeBlockInput | UpdateTimeBlockInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 시간 블록 생성/수정 폼 컴포넌트
export function TimeBlockForm({
  block,
  defaultDate,
  todos = [],
  onSubmit,
  onCancel,
  isLoading = false,
}: TimeBlockFormProps) {
  const t = useTranslations('time.blocks')
  const tc = useTranslations('common')

  const isEditMode = Boolean(block)

  // 폼 상태
  const [title, setTitle] = useState(block?.title ?? '')
  const [date, setDate] = useState(block?.date ?? defaultDate ?? '')
  const [startTime, setStartTime] = useState(block?.start_time ?? '09:00')
  const [endTime, setEndTime] = useState(block?.end_time ?? '10:00')
  const [color, setColor] = useState<string>(block?.color ?? '#3b82f6')
  const [todoId, setTodoId] = useState<string>(block?.todo_id ?? '')
  const [timeError, setTimeError] = useState<string>('')

  // 시각 변경 시 유효성 검사
  function handleStartTimeChange(value: string) {
    setStartTime(value)
    if (value && endTime && value >= endTime) {
      setTimeError(t('endTimeError'))
    } else {
      setTimeError('')
    }
  }

  function handleEndTimeChange(value: string) {
    setEndTime(value)
    if (startTime && value && startTime >= value) {
      setTimeError(t('endTimeError'))
    } else {
      setTimeError('')
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (startTime >= endTime) {
      setTimeError(t('endTimeError'))
      return
    }

    const data: CreateTimeBlockInput | UpdateTimeBlockInput = {
      title: title.trim(),
      date: date || undefined,
      start_time: startTime,
      end_time: endTime,
      color: color || undefined,
      todo_id: todoId || undefined,
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* 제목 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="block-title">
          {t('titleLabel')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="block-title"
          type="text"
          placeholder={t('titleLabel')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          disabled={isLoading}
          maxLength={200}
        />
      </div>

      {/* 날짜 */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="block-date">{tc('date')}</Label>
        <Input
          id="block-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* 시작/종료 시각 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="block-start-time">
            {t('startTime')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="block-start-time"
            type="time"
            value={startTime}
            onChange={(e) => handleStartTimeChange(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="block-end-time">
            {t('endTime')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="block-end-time"
            type="time"
            value={endTime}
            onChange={(e) => handleEndTimeChange(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
      </div>

      {/* 시각 에러 메시지 */}
      {timeError && (
        <p className="text-destructive text-xs -mt-2">{timeError}</p>
      )}

      {/* 색상 선택 */}
      <div className="flex flex-col gap-1.5">
        <Label>{t('colorLabel')}</Label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_PRESET_VALUES.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => setColor(preset.value)}
              disabled={isLoading}
              aria-label={t(preset.labelKey)}
              className={`size-8 rounded-full border-2 transition-all ${
                color === preset.value
                  ? 'border-foreground scale-110'
                  : 'border-transparent hover:scale-105'
              }`}
              style={{ backgroundColor: preset.value }}
            />
          ))}
        </div>
      </div>

      {/* 할일 연결 (선택사항) */}
      {todos.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="block-todo">{t('linkTodoLabel')}</Label>
          <Select
            value={todoId}
            onValueChange={setTodoId}
            disabled={isLoading}
          >
            <SelectTrigger id="block-todo">
              <SelectValue placeholder={t('noTodoLink')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t('noTodoLink')}</SelectItem>
              {todos.map((todo) => (
                <SelectItem key={todo.id} value={todo.id}>
                  {todo.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 버튼 영역 */}
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {tc('cancel')}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading || title.trim() === '' || Boolean(timeError)}
        >
          {isLoading ? tc('saving') : isEditMode ? tc('update') : tc('add')}
        </Button>
      </div>
    </form>
  )
}
