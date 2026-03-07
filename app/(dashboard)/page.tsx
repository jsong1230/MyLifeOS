'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Settings2 } from 'lucide-react'
import { GreetingHeader } from '@/components/dashboard/greeting-header'
import { TimeSummaryCard } from '@/components/dashboard/time-summary-card'
import { MoneySummaryCard } from '@/components/dashboard/money-summary-card'
import { HealthSummaryCard } from '@/components/dashboard/health-summary-card'
import { PrivateSummaryCard } from '@/components/dashboard/private-summary-card'
import { AiInsightsPreview } from '@/components/analytics/ai-insights-preview'
import { DashboardEditor } from '@/components/dashboard/dashboard-editor'
import { useDashboardLayout, useUpdateDashboardLayout } from '@/hooks/use-dashboard-layout'
import { DEFAULT_LAYOUT } from '@/types/dashboard-layout'
import type { WidgetConfig, WidgetKey } from '@/types/dashboard-layout'
import { Button } from '@/components/ui/button'

const WIDGET_COMPONENTS: Record<WidgetKey, React.ComponentType> = {
  insights: AiInsightsPreview,
  time:     TimeSummaryCard,
  money:    MoneySummaryCard,
  health:   HealthSummaryCard,
  private:  PrivateSummaryCard,
}

// 메인 대시보드 — 위젯 커스터마이징 지원
export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const [editorOpen, setEditorOpen] = useState(false)

  const { data: layout } = useDashboardLayout()
  const { mutate: updateLayout, isPending: isSaving } = useUpdateDashboardLayout()

  const activeLayout: WidgetConfig[] = layout ?? DEFAULT_LAYOUT
  const visibleWidgets = [...activeLayout]
    .sort((a, b) => a.order - b.order)
    .filter((w) => w.visible)

  function handleSave(newLayout: WidgetConfig[]) {
    updateLayout(newLayout, {
      onSuccess: () => setEditorOpen(false),
    })
  }

  return (
    <div className="px-4 max-w-2xl mx-auto">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <GreetingHeader />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="mt-1 shrink-0"
          onClick={() => setEditorOpen(true)}
          aria-label={t('edit')}
        >
          <Settings2 className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {visibleWidgets.map((w) => {
          const Component = WIDGET_COMPONENTS[w.key]
          return <Component key={w.key} />
        })}
      </div>

      <DashboardEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        initialLayout={activeLayout}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  )
}
