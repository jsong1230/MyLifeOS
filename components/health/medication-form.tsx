'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCreateMedication, useUpdateMedication } from '@/hooks/use-medications'
import type { CreateMedicationInput, MedicationFrequency, MedicationWithLog } from '@/types/medication'

interface MedicationFormProps {
  editing?: MedicationWithLog
  onSuccess: () => void
  onCancel: () => void
}

export function MedicationForm({ editing, onSuccess, onCancel }: MedicationFormProps) {
  const t = useTranslations('medications')
  const tCommon = useTranslations('common')

  const createMedication = useCreateMedication()
  const updateMedication = useUpdateMedication()

  const [name, setName] = useState(editing?.name ?? '')
  const [dosage, setDosage] = useState(editing?.dosage ?? '')
  const [frequency, setFrequency] = useState<MedicationFrequency>(editing?.frequency ?? 'daily')
  const [times, setTimes] = useState<string[]>(editing?.times ?? ['08:00'])

  const isPending = createMedication.isPending || updateMedication.isPending

  function addTime() {
    setTimes((prev) => [...prev, '08:00'])
  }

  function updateTime(index: number, value: string) {
    setTimes((prev) => prev.map((t, i) => (i === index ? value : t)))
  }

  function removeTime(index: number) {
    setTimes((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) return

    const input: CreateMedicationInput = {
      name: name.trim(),
      dosage: dosage.trim() || undefined,
      frequency,
      times: times.filter((t) => t.trim() !== ''),
    }

    try {
      if (editing) {
        await updateMedication.mutateAsync({ id: editing.id, ...input })
      } else {
        await createMedication.mutateAsync(input)
      }
      onSuccess()
    } catch {
      // 에러는 mutation state에서 처리
    }
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      {/* 약 이름 */}
      <div className="space-y-1.5">
        <Label htmlFor="med-name">
          {t('name')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="med-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('name')}
          required
          disabled={isPending}
        />
      </div>

      {/* 용량 */}
      <div className="space-y-1.5">
        <Label htmlFor="med-dosage">{t('dosage')}</Label>
        <Input
          id="med-dosage"
          value={dosage}
          onChange={(e) => setDosage(e.target.value)}
          placeholder="500mg, 1정, ..."
          disabled={isPending}
        />
      </div>

      {/* 복용 빈도 */}
      <div className="space-y-1.5">
        <Label htmlFor="med-frequency">{t('frequency')}</Label>
        <Select
          value={frequency}
          onValueChange={(v) => setFrequency(v as MedicationFrequency)}
          disabled={isPending}
        >
          <SelectTrigger id="med-frequency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">{t('frequency_daily')}</SelectItem>
            <SelectItem value="weekly">{t('frequency_weekly')}</SelectItem>
            <SelectItem value="as_needed">{t('frequency_as_needed')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 복용 시각 */}
      <div className="space-y-2">
        <Label>{t('times')}</Label>
        <div className="space-y-2">
          {times.map((time, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                type="time"
                value={time}
                onChange={(e) => updateTime(index, e.target.value)}
                disabled={isPending}
                className="flex-1"
              />
              {times.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTime(index)}
                  disabled={isPending}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  aria-label="시각 삭제"
                >
                  ✕
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTime}
          disabled={isPending}
          className="w-full"
        >
          + {t('add_time')}
        </Button>
      </div>

      {/* 에러 표시 */}
      {(createMedication.error || updateMedication.error) && (
        <p className="text-sm text-destructive">
          {(createMedication.error ?? updateMedication.error)?.message}
        </p>
      )}

      {/* 버튼 */}
      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending} className="flex-1">
          {tCommon('cancel')}
        </Button>
        <Button type="submit" disabled={isPending || !name.trim()} className="flex-1">
          {isPending ? tCommon('loading') : editing ? tCommon('update') : tCommon('save')}
        </Button>
      </div>
    </form>
  )
}
