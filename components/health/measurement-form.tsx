'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAddMeasurement } from '@/hooks/use-measurements'
import type { MeasurementType } from '@/types/health_measurement'

const UNIT_MAP: Record<MeasurementType, string> = {
  blood_pressure: 'mmHg',
  blood_sugar: 'mg/dL',
  body_temp: '°C',
}

interface MeasurementFormProps {
  onSuccess?: () => void
}

export function MeasurementForm({ onSuccess }: MeasurementFormProps) {
  const t = useTranslations('health.measurements')
  const tCommon = useTranslations('common')
  const addMutation = useAddMeasurement()

  const [type, setType] = useState<MeasurementType>('blood_pressure')
  const [value, setValue] = useState('')
  const [value2, setValue2] = useState('')
  const [measuredAt, setMeasuredAt] = useState<string>(() => {
    // datetime-local 형식: YYYY-MM-DDTHH:mm
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  })
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const unit = UNIT_MAP[type]
  const isBloodPressure = type === 'blood_pressure'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      setError(tCommon('error'))
      return
    }

    if (isBloodPressure) {
      const numValue2 = parseFloat(value2)
      if (isNaN(numValue2) || numValue2 <= 0) {
        setError(tCommon('error'))
        return
      }
    }

    try {
      await addMutation.mutateAsync({
        type,
        value: numValue,
        value2: isBloodPressure ? parseFloat(value2) : undefined,
        unit,
        measured_at: new Date(measuredAt).toISOString(),
        note: note.trim() || undefined,
      })
      // 폼 초기화
      setValue('')
      setValue2('')
      setNote('')
      onSuccess?.()
    } catch {
      setError(tCommon('error'))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 측정 유형 선택 */}
      <div className="space-y-1.5">
        <Label>{t('title')}</Label>
        <Select value={type} onValueChange={(v) => setType(v as MeasurementType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="blood_pressure">{t('blood_pressure')}</SelectItem>
            <SelectItem value="blood_sugar">{t('blood_sugar')}</SelectItem>
            <SelectItem value="body_temp">{t('body_temp')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 값 입력 */}
      {isBloodPressure ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="systolic">
              {t('systolic')} ({unit})
            </Label>
            <Input
              id="systolic"
              type="number"
              step="1"
              min="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              placeholder="120"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="diastolic">
              {t('diastolic')} ({unit})
            </Label>
            <Input
              id="diastolic"
              type="number"
              step="1"
              min="1"
              value={value2}
              onChange={(e) => setValue2(e.target.value)}
              required
              placeholder="80"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="value">
            {type === 'blood_sugar' ? t('blood_sugar') : t('body_temp')} ({unit})
          </Label>
          <Input
            id="value"
            type="number"
            step={type === 'body_temp' ? '0.1' : '1'}
            min="0"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            placeholder={type === 'blood_sugar' ? '100' : '36.5'}
          />
        </div>
      )}

      {/* 측정 시각 */}
      <div className="space-y-1.5">
        <Label htmlFor="measured_at">{t('measured_at')}</Label>
        <Input
          id="measured_at"
          type="datetime-local"
          value={measuredAt}
          onChange={(e) => setMeasuredAt(e.target.value)}
          required
        />
      </div>

      {/* 메모 */}
      <div className="space-y-1.5">
        <Label htmlFor="note">{t('note')}</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={`${t('note')}...`}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button type="submit" className="w-full" disabled={addMutation.isPending}>
        {addMutation.isPending ? tCommon('loading') : tCommon('save')}
      </Button>
    </form>
  )
}
