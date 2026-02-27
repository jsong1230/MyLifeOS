'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Routine, CreateRoutineInput, UpdateRoutineInput, RoutineFrequency } from '@/types/routine'

interface RoutineFormProps {
  routine?: Routine
  onSubmit: (data: CreateRoutineInput | UpdateRoutineInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

/**
 * 루틴 생성/수정 폼 컴포넌트
 */
export function RoutineForm({
  routine,
  onSubmit,
  onCancel,
  isLoading = false,
}: RoutineFormProps) {
  const t = useTranslations('time.routines')
  const tCommon = useTranslations('common')
  const [title, setTitle] = useState(routine?.title ?? '')
  const [description, setDescription] = useState(routine?.description ?? '')
  const [frequency, setFrequency] = useState<RoutineFrequency>(
    routine?.frequency ?? 'daily'
  )
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    routine?.days_of_week ?? []
  )
  const [intervalDays, setIntervalDays] = useState<string>(
    routine?.interval_days?.toString() ?? '2'
  )
  const [timeOfDay, setTimeOfDay] = useState(routine?.time_of_day ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 요일 키 순서 (0=일, 1=월, ..., 6=토)
  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

  // 루틴 prop 변경 시 폼 초기화
  useEffect(() => {
    setTitle(routine?.title ?? '')
    setDescription(routine?.description ?? '')
    setFrequency(routine?.frequency ?? 'daily')
    setDaysOfWeek(routine?.days_of_week ?? [])
    setIntervalDays(routine?.interval_days?.toString() ?? '2')
    setTimeOfDay(routine?.time_of_day ?? '')
    setErrors({})
  }, [routine])

  // 요일 토글
  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

  // 폼 유효성 검사
  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!title.trim()) {
      newErrors.title = t('title')
    }

    if (frequency === 'weekly' && daysOfWeek.length === 0) {
      newErrors.daysOfWeek = t('days')
    }

    if (frequency === 'custom') {
      const days = parseInt(intervalDays, 10)
      if (isNaN(days) || days < 1) {
        newErrors.intervalDays = t('intervalDays', { n: 1 })
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 폼 제출 처리
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validate()) return

    const data: CreateRoutineInput | UpdateRoutineInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      frequency,
      days_of_week: frequency === 'weekly' ? daysOfWeek : undefined,
      interval_days: frequency === 'custom' ? parseInt(intervalDays, 10) : undefined,
      time_of_day: timeOfDay || undefined,
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 제목 */}
      <div className="space-y-1.5">
        <Label htmlFor="routine-title">
          {t('title')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="routine-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('title')}
          disabled={isLoading}
          aria-invalid={Boolean(errors.title)}
        />
        {errors.title && (
          <p className="text-destructive text-xs">{errors.title}</p>
        )}
      </div>

      {/* 반복 주기 */}
      <div className="space-y-1.5">
        <Label htmlFor="routine-frequency">
          {t('days')} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={frequency}
          onValueChange={(val) => setFrequency(val as RoutineFrequency)}
          disabled={isLoading}
        >
          <SelectTrigger id="routine-frequency">
            <SelectValue placeholder={t('days')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">{t('everyday')}</SelectItem>
            <SelectItem value="weekly">{t('specificDays')}</SelectItem>
            <SelectItem value="custom">{t('intervalDays', { n: 'N' })}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 요일 선택 (weekly인 경우) */}
      {frequency === 'weekly' && (
        <div className="space-y-1.5">
          <Label>{t('days')} <span className="text-destructive">*</span></Label>
          <div className="flex gap-1.5 flex-wrap">
            {dayKeys.map((key, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleDay(idx)}
                disabled={isLoading}
                className={cn(
                  'w-9 h-9 rounded-full text-sm font-medium border transition-colors',
                  daysOfWeek.includes(idx)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-foreground border-input hover:bg-accent'
                )}
                aria-pressed={daysOfWeek.includes(idx)}
                aria-label={t(`weekdays.${key}`)}
              >
                {t(`weekdays.${key}`)}
              </button>
            ))}
          </div>
          {errors.daysOfWeek && (
            <p className="text-destructive text-xs">{errors.daysOfWeek}</p>
          )}
        </div>
      )}

      {/* 간격 일수 (custom인 경우) */}
      {frequency === 'custom' && (
        <div className="space-y-1.5">
          <Label htmlFor="routine-interval">
            {t('everyNDays', { n: 'N' })} <span className="text-destructive">*</span>
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="routine-interval"
              type="number"
              min={1}
              value={intervalDays}
              onChange={(e) => setIntervalDays(e.target.value)}
              className="w-24"
              disabled={isLoading}
              aria-invalid={Boolean(errors.intervalDays)}
            />
            <span className="text-sm text-muted-foreground">{t('everyNDays', { n: '' }).trim()}</span>
          </div>
          {errors.intervalDays && (
            <p className="text-destructive text-xs">{errors.intervalDays}</p>
          )}
        </div>
      )}

      {/* 실행 시간 (선택) */}
      <div className="space-y-1.5">
        <Label htmlFor="routine-time">
          {tCommon('time')} ({tCommon('optional')})
        </Label>
        <Input
          id="routine-time"
          type="time"
          step={60}
          value={timeOfDay}
          onChange={(e) => setTimeOfDay(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* 설명 (선택) */}
      <div className="space-y-1.5">
        <Label htmlFor="routine-description">
          {tCommon('description')} ({tCommon('optional')})
        </Label>
        <Input
          id="routine-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={tCommon('description')}
          disabled={isLoading}
        />
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-2">
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? tCommon('saving') : routine ? tCommon('update') : tCommon('add')}
        </Button>
      </div>
    </form>
  )
}
