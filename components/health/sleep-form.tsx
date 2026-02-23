'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
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
  if (endMin <= startMin) endMin += 24 * 60 // 자정 넘김
  return Math.round(((endMin - startMin) / 60) * 10) / 10 // 소수점 1자리
}

// 수면 시간 미리보기 포맷 (예: 7.5h → "7시간 30분")
function formatSleepHoursPreview(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  if (m === 0) return `${h}시간`
  return `${h}시간 ${m}분`
}

// 수면 질 별점 레이블
const QUALITY_LABELS: Record<number, string> = {
  1: '매우 나쁨',
  2: '나쁨',
  3: '보통',
  4: '좋음',
  5: '매우 좋음',
}

interface SleepFormProps {
  sleep?: SleepLog
  onSubmit: (data: CreateSleepInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 수면 기록 생성/수정 폼 컴포넌트
export function SleepForm({ sleep, onSubmit, onCancel, isLoading = false }: SleepFormProps) {
  const [timeStart, setTimeStart] = useState(sleep?.time_start ?? '23:00')
  const [timeEnd, setTimeEnd] = useState(sleep?.time_end ?? '07:00')
  const [quality, setQuality] = useState<number | ''>(sleep?.value2 ?? '')
  const [date, setDate] = useState(sleep?.date ?? new Date().toISOString().split('T')[0])
  const [note, setNote] = useState(sleep?.note ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 예상 수면 시간 실시간 미리보기
  const [sleepPreview, setSleepPreview] = useState<string | null>(null)

  useEffect(() => {
    const timePattern = /^\d{2}:\d{2}$/
    if (timePattern.test(timeStart) && timePattern.test(timeEnd)) {
      const hours = calcSleepHours(timeStart, timeEnd)
      const isMidnightCross = timeToMinutes(timeEnd) <= timeToMinutes(timeStart)
      setSleepPreview(
        `${formatSleepHoursPreview(hours)}${isMidnightCross ? ' (자정 넘김)' : ''}`
      )
    } else {
      setSleepPreview(null)
    }
  }, [timeStart, timeEnd])

  // 폼 검증
  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    const timePattern = /^\d{2}:\d{2}$/

    if (!timeStart || !timePattern.test(timeStart)) {
      newErrors.timeStart = '취침 시각을 입력하세요 (HH:MM)'
    }

    if (!timeEnd || !timePattern.test(timeEnd)) {
      newErrors.timeEnd = '기상 시각을 입력하세요 (HH:MM)'
    }

    if (quality !== '') {
      const q = Number(quality)
      if (isNaN(q) || q < 1 || q > 5) {
        newErrors.quality = '수면 질은 1~5 사이의 값이어야 합니다'
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      newErrors.date = '날짜 형식이 올바르지 않습니다'
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
            취침 시각 <span className="text-destructive">*</span>
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
            기상 시각 <span className="text-destructive">*</span>
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
          예상 수면 시간: <span className="font-semibold">{sleepPreview}</span>
        </div>
      )}

      {/* 수면 질 별점 선택 (1-5) */}
      <div className="space-y-2">
        <Label>수면 질 (선택)</Label>
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
              title={QUALITY_LABELS[q]}
            >
              {'★'.repeat(q)}
            </button>
          ))}
        </div>
        {quality !== '' && (
          <p className="text-xs text-muted-foreground">{QUALITY_LABELS[Number(quality)]}</p>
        )}
        {errors.quality && (
          <p className="text-xs text-destructive">{errors.quality}</p>
        )}
      </div>

      {/* 날짜 입력 */}
      <div className="space-y-2">
        <Label htmlFor="date">날짜</Label>
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
        <Label htmlFor="note">메모 (선택)</Label>
        <Input
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="수면에 영향을 준 요인 등 메모"
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
            취소
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '저장 중...' : sleep ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  )
}
