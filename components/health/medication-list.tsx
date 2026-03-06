'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useMedications } from '@/hooks/use-medications'
import { MedicationCard } from '@/components/health/medication-card'
import { MedicationForm } from '@/components/health/medication-form'
import type { MedicationWithLog } from '@/types/medication'

interface MedicationListProps {
  showAddDialog?: boolean
  onAddDialogClose?: () => void
}

export function MedicationList({ showAddDialog = false, onAddDialogClose }: MedicationListProps) {
  const t = useTranslations('medications')
  const { data: medications, isLoading, error } = useMedications()

  const [editingMedication, setEditingMedication] = useState<MedicationWithLog | null>(null)

  const totalCount = medications?.length ?? 0
  const takenCount = medications?.filter((m) => m.taken_today).length ?? 0

  function handleEditSuccess() {
    setEditingMedication(null)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-destructive text-center py-6">
        {error.message}
      </p>
    )
  }

  return (
    <>
      {/* 오늘 복용 현황 요약 */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border bg-card px-4 py-3 shadow-sm">
          <span className="text-sm font-medium">{t('today_summary')}</span>
          <span className="text-sm font-semibold">
            <span className={takenCount === totalCount ? 'text-green-600' : 'text-foreground'}>
              {takenCount}
            </span>
            <span className="text-muted-foreground"> / {totalCount}</span>
          </span>
        </div>
      )}

      {/* 약 목록 */}
      {totalCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
          <span className="text-4xl">💊</span>
          <p className="text-muted-foreground text-sm">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {medications?.map((medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              onEdit={setEditingMedication}
            />
          ))}
        </div>
      )}

      {/* 추가 다이얼로그 */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && onAddDialogClose?.()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('add')}</DialogTitle>
          </DialogHeader>
          <MedicationForm
            onSuccess={() => onAddDialogClose?.()}
            onCancel={() => onAddDialogClose?.()}
          />
        </DialogContent>
      </Dialog>

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editingMedication} onOpenChange={(open) => !open && setEditingMedication(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit')}</DialogTitle>
          </DialogHeader>
          {editingMedication && (
            <MedicationForm
              editing={editingMedication}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingMedication(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
