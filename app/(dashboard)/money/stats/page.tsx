'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useHeatmapData, useSpendingPatterns } from '@/hooks/use-money-stats'

// 차트/테이블이 포함된 컴포넌트를 lazy load
const SpendingHeatmap = dynamic(
  () =>
    import('@/components/money/spending-heatmap').then((m) => ({
      default: m.SpendingHeatmap,
    })),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
)

const SpendingPatterns = dynamic(
  () =>
    import('@/components/money/spending-patterns').then((m) => ({
      default: m.SpendingPatterns,
    })),
  { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> }
)

type Tab = 'heatmap' | 'patterns'

export default function MoneyStatsPage() {
  const t = useTranslations('moneyStats')
  const [activeTab, setActiveTab] = useState<Tab>('heatmap')

  const {
    data: heatmapData,
    isLoading: isLoadingHeatmap,
    error: heatmapError,
  } = useHeatmapData()

  const {
    data: patternsData,
    isLoading: isLoadingPatterns,
    error: patternsError,
  } = useSpendingPatterns()

  const tabs: { key: Tab; label: string }[] = [
    { key: 'heatmap', label: t('heatmap') },
    { key: 'patterns', label: t('patterns') },
  ]

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      {/* 헤더 */}
      <h1 className="text-xl font-semibold">{t('title')}</h1>

      {/* 탭 */}
      <div className="flex gap-2 border-b pb-0">
        {tabs.map(({ key, label }) => (
          <Button
            key={key}
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab(key)}
            className={[
              'rounded-b-none border-b-2 transition-colors',
              activeTab === key
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground',
            ].join(' ')}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'heatmap' && (
        <div>
          {isLoadingHeatmap && <Skeleton className="h-64 w-full" />}
          {heatmapError && (
            <p className="text-destructive text-sm text-center py-8">
              {t('no_data')}
            </p>
          )}
          {!isLoadingHeatmap && !heatmapError && heatmapData && (
            <SpendingHeatmap data={heatmapData} />
          )}
        </div>
      )}

      {activeTab === 'patterns' && (
        <div>
          {isLoadingPatterns && (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}
          {patternsError && (
            <p className="text-destructive text-sm text-center py-8">
              {t('no_data')}
            </p>
          )}
          {!isLoadingPatterns && !patternsError && patternsData && (
            <SpendingPatterns data={patternsData} />
          )}
        </div>
      )}
    </div>
  )
}
