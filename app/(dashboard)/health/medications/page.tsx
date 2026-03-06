'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { MedicationList } from '@/components/health/medication-list'

export default function MedicationsPage() {
  const t = useTranslations('medications')
  const [showAddDialog, setShowAddDialog] = useState(false)

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <Button onClick={() => setShowAddDialog(true)}>
          + {t('add')}
        </Button>
      </div>

      {/* 복약 목록 */}
      <MedicationList
        showAddDialog={showAddDialog}
        onAddDialogClose={() => setShowAddDialog(false)}
      />
    </div>
  )
}
