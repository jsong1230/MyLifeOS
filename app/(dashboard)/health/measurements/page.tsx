'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MeasurementForm } from '@/components/health/measurement-form'
import { MeasurementList } from '@/components/health/measurement-list'
import { MeasurementChart } from '@/components/health/measurement-chart'
import { useMeasurements } from '@/hooks/use-measurements'
import type { MeasurementType } from '@/types/health_measurement'

const TABS: MeasurementType[] = ['blood_pressure', 'blood_sugar', 'body_temp']

function MeasurementTab({ type }: { type: MeasurementType }) {
  const t = useTranslations('health.measurements')
  const tCommon = useTranslations('common')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data, isLoading } = useMeasurements(type, 30)
  const measurements = data?.data ?? []

  return (
    <div className="space-y-4">
      {/* 차트 */}
      {isLoading ? (
        <div className="h-[220px] bg-muted rounded-xl animate-pulse" />
      ) : (
        <MeasurementChart measurements={measurements} type={type} />
      )}

      {/* 기록 추가 버튼 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">{t('add')}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('add')}</DialogTitle>
          </DialogHeader>
          <MeasurementForm onSuccess={() => setDialogOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* 기록 목록 */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <MeasurementList measurements={measurements} type={type} />
      )}

      {/* 로딩/에러가 없고 기록이 있는 경우 빈 상태 텍스트는 MeasurementList에서 처리 */}
      {!isLoading && measurements.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {tCommon('total')}: {measurements.length}
        </p>
      )}
    </div>
  )
}

export default function MeasurementsPage() {
  const t = useTranslations('health.measurements')
  const [activeTab, setActiveTab] = useState<MeasurementType>('blood_pressure')

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MeasurementType)}>
        <TabsList className="w-full">
          {TABS.map((tab) => (
            <TabsTrigger key={tab} value={tab} className="flex-1 text-xs">
              {t(tab)}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <MeasurementTab type={tab} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
