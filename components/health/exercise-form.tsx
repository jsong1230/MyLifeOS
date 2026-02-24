'use client'

import { useState } from 'react'
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
import {
  EXERCISE_INTENSITY_LABEL,
  type ExerciseLog,
  type ExerciseIntensity,
  type CreateExerciseInput,
} from '@/types/health'

interface ExerciseFormProps {
  log?: ExerciseLog
  defaultDate?: string
  onSubmit: (data: CreateExerciseInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const EXERCISE_KEYS = ['running', 'walking', 'swimming', 'cycling', 'gym', 'yoga', 'pilates', 'hiking', 'soccer', 'basketball'] as const

export function ExerciseForm({ log, defaultDate, onSubmit, onCancel, isLoading = false }: ExerciseFormProps) {
  const t = useTranslations('health.exercise')
  const tc = useTranslations('common')

  // 자주 쓰는 운동 목록 (로케일 기반)
  const commonExercises = EXERCISE_KEYS.map(key => t(`commonExercises.${key}` as Parameters<typeof t>[0]))

  const [exerciseType, setExerciseType] = useState(log?.exercise_type ?? '')
  const [durationMin, setDurationMin] = useState(log ? String(log.duration_min) : '')
  const [intensity, setIntensity] = useState<ExerciseIntensity>(log?.intensity ?? 'moderate')
  const [calories, setCalories] = useState(log?.calories_burned != null ? String(log.calories_burned) : '')
  const [date, setDate] = useState(log?.date ?? defaultDate ?? getTodayString())
  const [note, setNote] = useState(log?.note ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    if (!exerciseType.trim()) newErrors.exerciseType = t('exerciseTypeRequired')
    const dur = parseInt(durationMin)
    if (!durationMin || isNaN(dur) || dur <= 0) newErrors.duration = t('durationRequired')

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const cal = calories ? parseInt(calories) : undefined
    onSubmit({
      exercise_type: exerciseType.trim(),
      duration_min: dur,
      intensity,
      calories_burned: cal,
      date,
      note: note.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 날짜 */}
      <div className="space-y-1.5">
        <Label htmlFor="ex-date">{tc('date')}</Label>
        <Input
          id="ex-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* 운동 종류 */}
      <div className="space-y-1.5">
        <Label htmlFor="exercise-type">{t('exerciseTypeLabel')} <span className="text-destructive">*</span></Label>
        <Input
          id="exercise-type"
          type="text"
          placeholder={t('exerciseTypePlaceholder')}
          value={exerciseType}
          onChange={(e) => { setExerciseType(e.target.value); setErrors((p) => ({ ...p, exerciseType: '' })) }}
          className={errors.exerciseType ? 'border-destructive' : ''}
          list="exercise-suggestions"
        />
        <datalist id="exercise-suggestions">
          {commonExercises.map((ex) => <option key={ex} value={ex} />)}
        </datalist>
        {errors.exerciseType && <p className="text-xs text-destructive">{errors.exerciseType}</p>}
      </div>

      {/* 운동 시간 */}
      <div className="space-y-1.5">
        <Label htmlFor="duration">{t('durationLabel')} <span className="text-destructive">*</span></Label>
        <Input
          id="duration"
          type="number"
          min="1"
          max="1440"
          placeholder={t('durationPlaceholder')}
          value={durationMin}
          onChange={(e) => { setDurationMin(e.target.value); setErrors((p) => ({ ...p, duration: '' })) }}
          className={errors.duration ? 'border-destructive' : ''}
        />
        {errors.duration && <p className="text-xs text-destructive">{errors.duration}</p>}
      </div>

      {/* 강도 */}
      <div className="space-y-1.5">
        <Label htmlFor="intensity">{t('intensityLabel')}</Label>
        <Select value={intensity} onValueChange={(v) => setIntensity(v as ExerciseIntensity)}>
          <SelectTrigger id="intensity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(EXERCISE_INTENSITY_LABEL) as ExerciseIntensity[]).map((val) => (
              <SelectItem key={val} value={val}>
                {t(`intensities.${val}` as Parameters<typeof t>[0])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 소모 칼로리 */}
      <div className="space-y-1.5">
        <Label htmlFor="calories">{t('caloriesLabel')}</Label>
        <Input
          id="calories"
          type="number"
          min="0"
          placeholder={t('caloriesPlaceholder')}
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
        />
      </div>

      {/* 메모 */}
      <div className="space-y-1.5">
        <Label htmlFor="ex-note">{t('noteLabel')}</Label>
        <Input
          id="ex-note"
          type="text"
          placeholder={t('notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={100}
        />
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
            {tc('cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? tc('saving') : log ? tc('update') : tc('add')}
        </Button>
      </div>
    </form>
  )
}
