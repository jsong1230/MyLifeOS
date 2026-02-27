'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { useRecurringUnrecorded } from '@/hooks/use-recurring-auto-record'
import type { RecurringExpense } from '@/types/recurring'

interface RecurringReminderBannerProps {
  expenses: RecurringExpense[]
}

export function RecurringReminderBanner({ expenses }: RecurringReminderBannerProps) {
  const t = useTranslations('money.recurring')
  const qc = useQueryClient()
  const unrecorded = useRecurringUnrecorded(expenses)
  const [dismissed, setDismissed] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  if (dismissed || unrecorded.length === 0) return null

  async function handleBatchRecord() {
    setIsRecording(true)
    try {
      await fetch('/api/recurring/batch-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: unrecorded.map((e) => ({
            id: e.id,
            amount: e.amount,
            currency: e.currency,
            category_id: e.category_id,
            name: e.name,
          })),
        }),
      })
      await qc.invalidateQueries({ queryKey: ['transactions'] })
      await qc.invalidateQueries({ queryKey: ['recurring'] })
      setDismissed(true)
    } finally {
      setIsRecording(false)
    }
  }

  return (
    <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-800 flex items-center justify-between gap-3">
      <p className="text-sm text-amber-800 dark:text-amber-200">
        {t('unrecordedAlert', { count: unrecorded.length })}
      </p>
      <div className="flex gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setDismissed(true)}
          className="text-xs h-7"
        >
          {t('dismissAlert')}
        </Button>
        <Button
          size="sm"
          onClick={handleBatchRecord}
          disabled={isRecording}
          className="text-xs h-7"
        >
          {isRecording ? '...' : t('batchRecord')}
        </Button>
      </div>
    </div>
  )
}
