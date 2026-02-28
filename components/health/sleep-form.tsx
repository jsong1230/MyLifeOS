'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { getToday } from '@/lib/date-utils'
import type { SleepLog, CreateSleepInput } from '@/types/health'

// HH:MM → 분 변환
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// 수면 시간 계산 (자정 초과 처리)
function calcSleepHours(start: string, end: string): number {
  let startMin = timeToMinutes(start)
  let endMin = timeToMinutes(end)
  if (endMin <= startMin) endMin += 24 * 60
  return Math.round(((endMin - startMin) / 60) * 10) / 10
}

// 수면 질 레이블 키 매핑
const QUALITY_LABEL_KEYS: Record<number, string> = {
  1: 'veryPoor',
  2: 'poor',
  3: 'fair',
  4: 'good',
  5: 'excellent',
}

interface SleepFormProps {
  sleep?: SleepLog
  onSubmit: (data: CreateSleepInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 수면 기록 생성/수정 폼 컴포넌트
export function SleepForm({ sleep, onSubmit, onCancel, isLoading = false }: SleepFormProps) {
  const t = useTranslations('health.sleep')
  const tCommon = useTranslations('common')
  const [timeStart, setTimeStart] = useState(sleep?.time_start ?? '23:00')
  const [timeEnd, setTimeEnd] = useState(sleep?.time_end ?? '07:00')
  const [quality, setQuality] = useState<number | ''>(sleep?.value2 ?? '')
  const [date, setDate] = useState(sleep?.date ?? getToday())
  const [note, setNote] = useState(sleep?.note ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sleepPreview, setSleepPreview] = useState<string | null>(null)

  // 수면 시간 포맷 (예: 7.5h → "7시간 30분")
  function formatSleepHoursPreview(hours: number): string {
    const h = Math.floor(hours)
    const m = Math.round((hours - h) * 60)
    if (m === 0) return `${h}${t('hourUnit')}`
    return `${h}${t('hourUnit')} ${m}${t('minuteUnit')}`
  }

  useEffect(() => {
    const timePattern = /^\d{2}:\d{2}$/
    if (timePattern.test(timeStart) && timePattern.test(timeEnd)) {
      const hours = calcSleepHours(timeStart, timeEnd)
      const isMidnightCross = timeToMinutes(timeEnd) <= timeToMinutes(timeStart)
      const preview = formatSleepHoursPreview(hours)
      setSleepPreview(
        isMidnightCross ? `${preview} (${t('midnight')})` : preview
      )
    } else {
      setSleepPreview(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeStart, timeEnd])

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    const timePattern = /^\d{2}:\d{2}$/

    if (!timeStart || !timePattern.test(timeStart)) {
      newErrors.timeStart = t('bedtimeLabel')
    }

    if (!timeEnd || !timePattern.test(timeEnd)) {
      newErrors.timeEnd = t('wakeTimeLabel')
    }

    if (quality !== '') {
      const q = Number(quality)
      if (isNaN(q) || q < 1 || q > 5) {
        newErrors.quality = t('qualityLabel')
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      newErrors.date = tCommon('invalidDate')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      time_start: timeStart,
      time_end: timeEnd,
      value2: quality !== '' ? Number(quality) : undefined,
      date,
      note: note.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 취침/기상 시각 입력 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="time-start">
            {t('bedtimeLabel')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="time-start"
            type="time"
            value={timeStart}
            onChange={(e) => setTimeStart(e.target.value)}
            disabled={isLoading}
          />
          {errors.timeStart && (
            <p className="text-xs text-destructive">{errors.timeStart}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="time-end">
            {t('wakeTimeLabel')} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="time-end"
            type="time"
            value={timeEnd}
            onChange={(e) => setTimeEnd(e.target.value)}
            disabled={isLoading}
          />
          {errors.timeEnd && (
            <p className="text-xs text-destructive">{errors.timeEnd}</p>
          )}
        </div>
      </div>

      {/* 예상 수면 시간 미리보기 */}
      {sleepPreview && (
        <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          {t('estimatedDuration', { time: sleepPreview })}
        </div>
      )}

      {/* 수면 질 별점 선택 (1-5) */}
      <div className="space-y-2">
        <Label>{t('qualityLabel')}</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setQuality(quality === q ? '' : q)}
              disabled={isLoading}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md border transition-colors',
                quality === q
                  ? 'bg-yellow-400 text-yellow-900 border-yellow-400'
                  : 'border-gray-200 text-gray-500 hover:bg-yellow-50 hover:border-yellow-300'
              )}
              title={t(`qualities.${QUALITY_LABEL_KEYS[q]}`)}
            >
              {'★'.repeat(q)}
            </button>
          ))}
        </div>
        {quality !== '' && (
          <p className="text-xs text-muted-foreground">
            {t(`qualities.${QUALITY_LABEL_KEYS[Number(quality)]}`)}
          </p>
        )}
        {errors.quality && (
          <p className="text-xs text-destructive">{errors.quality}</p>
        )}
      </div>

      {/* 날짜 입력 */}
      <div className="space-y-2">
        <Label htmlFor="date">{tCommon('date')}</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isLoading}
        />
        {errors.date && (
          <p className="text-xs text-destructive">{errors.date}</p>
        )}
      </div>

      {/* 메모 입력 (선택) */}
      <div className="space-y-2">
        <Label htmlFor="note">
          {tCommon('memo')} ({tCommon('optional')})
        </Label>
        <Input
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={tCommon('memo')}
          disabled={isLoading}
        />
      </div>

      {/* 버튼 */}
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? tCommon('saving') : sleep ? tCommon('update') : tCommon('add')}
        </Button>
      </div>
    </form>
  )
}
