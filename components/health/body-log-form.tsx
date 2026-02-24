'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BodyLog, CreateBodyLogInput } from '@/types/health'

interface BodyLogFormProps {
  log?: BodyLog
  onSubmit: (data: CreateBodyLogInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

function getTodayString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function BodyLogForm({ log, onSubmit, onCancel, isLoading = false }: BodyLogFormProps) {
  const t = useTranslations('health.body')
  const tc = useTranslations('common')

  const [weight, setWeight] = useState(log?.weight != null ? String(log.weight) : '')
  const [bodyFat, setBodyFat] = useState(log?.body_fat != null ? String(log.body_fat) : '')
  const [muscleMass, setMuscleMass] = useState(log?.muscle_mass != null ? String(log.muscle_mass) : '')
  const [date, setDate] = useState(log?.date ?? getTodayString())
  const [note, setNote] = useState(log?.note ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const w = weight ? parseFloat(weight) : undefined
    const bf = bodyFat ? parseFloat(bodyFat) : undefined
    const mm = muscleMass ? parseFloat(muscleMass) : undefined

    if (w == null && bf == null && mm == null) {
      setError(t('atLeastOne'))
      return
    }

    onSubmit({
      weight: w,
      body_fat: bf,
      muscle_mass: mm,
      date,
      note: note.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 날짜 */}
      <div className="space-y-1.5">
        <Label htmlFor="body-date">{tc('date')}</Label>
        <Input
          id="body-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* 체중 */}
      <div className="space-y-1.5">
        <Label htmlFor="weight">{t('weight')} ({t('weightUnit')})</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          min="0"
          max="500"
          placeholder={t('weightPlaceholder')}
          value={weight}
          onChange={(e) => { setWeight(e.target.value); setError('') }}
        />
      </div>

      {/* 체지방률 */}
      <div className="space-y-1.5">
        <Label htmlFor="body-fat">{t('bodyFat')} ({t('percentUnit')})</Label>
        <Input
          id="body-fat"
          type="number"
          step="0.1"
          min="0"
          max="100"
          placeholder={t('bodyFatPlaceholder')}
          value={bodyFat}
          onChange={(e) => { setBodyFat(e.target.value); setError('') }}
        />
      </div>

      {/* 근육량 */}
      <div className="space-y-1.5">
        <Label htmlFor="muscle-mass">{t('muscle')} ({t('weightUnit')})</Label>
        <Input
          id="muscle-mass"
          type="number"
          step="0.1"
          min="0"
          max="200"
          placeholder={t('musclePlaceholder')}
          value={muscleMass}
          onChange={(e) => { setMuscleMass(e.target.value); setError('') }}
        />
      </div>

      {/* 메모 */}
      <div className="space-y-1.5">
        <Label htmlFor="body-note">{tc('memo')} ({tc('optional')})</Label>
        <Input
          id="body-note"
          type="text"
          placeholder={t('notePlaceholder')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={100}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

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
