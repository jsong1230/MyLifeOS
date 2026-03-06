'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToggleMedicationLog, useUpdateMedication, useDeleteMedication } from '@/hooks/use-medications'
import type { MedicationWithLog } from '@/types/medication'

interface MedicationCardProps {
  medication: MedicationWithLog
  onEdit: (medication: MedicationWithLog) => void
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'frequency_daily',
  weekly: 'frequency_weekly',
  as_needed: 'frequency_as_needed',
}

export function MedicationCard({ medication, onEdit }: MedicationCardProps) {
  const t = useTranslations('medications')
  const [optimisticTaken, setOptimisticTaken] = useState<boolean | null>(null)

  const { checkIn, checkOut } = useToggleMedicationLog(medication.id)
  const updateMedication = useUpdateMedication()
  const deleteMedication = useDeleteMedication()

  const isTaken = optimisticTaken !== null ? optimisticTaken : medication.taken_today
  const isPending = checkIn.isPending || checkOut.isPending

  async function handleToggle() {
    const next = !isTaken
    setOptimisticTaken(next)
    try {
      if (next) {
        await checkIn.mutateAsync()
      } else {
        await checkOut.mutateAsync()
      }
    } catch {
      // 실패 시 롤백
      setOptimisticTaken(isTaken)
    } finally {
      setOptimisticTaken(null)
    }
  }

  function handleDeactivate() {
    void updateMedication.mutate({ id: medication.id, is_active: false })
  }

  function handleDelete() {
    void deleteMedication.mutate(medication.id)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl border p-4 shadow-sm transition-colors',
        isTaken
          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
          : 'bg-card border-border'
      )}
    >
      {/* 복용 체크박스 */}
      <Checkbox
        checked={isTaken}
        disabled={isPending}
        onCheckedChange={() => void handleToggle()}
        aria-label={isTaken ? t('taken') : t('not_taken')}
        className={cn(
          'h-5 w-5 flex-shrink-0',
          isTaken && 'border-green-500 data-[state=checked]:bg-green-500'
        )}
      />

      {/* 약 정보 */}
      <div className="flex-1 min-w-0">
        <p className={cn('font-medium truncate', isTaken && 'line-through text-muted-foreground')}>
          {medication.name}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {medication.dosage && (
            <span className="text-xs text-muted-foreground">{medication.dosage}</span>
          )}
          <span className="text-xs text-muted-foreground">
            {t(FREQUENCY_LABELS[medication.frequency] ?? 'frequency_daily')}
          </span>
          {medication.times.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {medication.times.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* 복용 상태 라벨 */}
      <span
        className={cn(
          'text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0',
          isTaken
            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isTaken ? t('taken') : t('not_taken')}
      </span>

      {/* 더보기 메뉴 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" aria-label="더보기">
            <span className="text-base">⋯</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(medication)}>
            {t('edit')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDeactivate}>
            {t('deactivate')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-destructive focus:text-destructive"
          >
            {t('delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
