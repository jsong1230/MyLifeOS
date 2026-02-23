'use client'

import { useState } from 'react'
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
      setError('체중, 체지방률, 근육량 중 하나 이상 입력해주세요')
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
        <Label htmlFor="body-date">날짜</Label>
        <Input
          id="body-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* 체중 */}
      <div className="space-y-1.5">
        <Label htmlFor="weight">체중 (kg)</Label>
        <Input
          id="weight"
          type="number"
          step="0.1"
          min="0"
          max="500"
          placeholder="예: 70.5"
          value={weight}
          onChange={(e) => { setWeight(e.target.value); setError('') }}
        />
      </div>

      {/* 체지방률 */}
      <div className="space-y-1.5">
        <Label htmlFor="body-fat">체지방률 (%)</Label>
        <Input
          id="body-fat"
          type="number"
          step="0.1"
          min="0"
          max="100"
          placeholder="예: 20.5"
          value={bodyFat}
          onChange={(e) => { setBodyFat(e.target.value); setError('') }}
        />
      </div>

      {/* 근육량 */}
      <div className="space-y-1.5">
        <Label htmlFor="muscle-mass">근육량 (kg)</Label>
        <Input
          id="muscle-mass"
          type="number"
          step="0.1"
          min="0"
          max="200"
          placeholder="예: 30.0"
          value={muscleMass}
          onChange={(e) => { setMuscleMass(e.target.value); setError('') }}
        />
      </div>

      {/* 메모 */}
      <div className="space-y-1.5">
        <Label htmlFor="body-note">메모 (선택)</Label>
        <Input
          id="body-note"
          type="text"
          placeholder="예: 아침 공복 측정"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={100}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="flex-1">
            취소
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? '저장 중...' : log ? '수정하기' : '추가하기'}
        </Button>
      </div>
    </form>
  )
}
