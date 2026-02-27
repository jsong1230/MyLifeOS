'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Heart, ChevronRight, Utensils, Moon } from 'lucide-react'
import { useDashboardSummary } from '@/hooks/use-dashboard-summary'

// 건강 모듈 요약 카드 — 오늘 식사 칼로리 + 수면 시간
export function HealthSummaryCard() {
  const t = useTranslations('dashboard')
  const { data, isLoading } = useDashboardSummary()

  const { count: mealCount, totalCalories, byType } = data?.meals ?? {
    count: 0,
    totalCalories: 0,
    byType: { breakfast: 0, lunch: 0, dinner: 0, snack: 0 },
  }
  const sleepHours = data?.sleep.hours ?? null
  const hasData = mealCount > 0 || sleepHours !== null

  return (
    <Link href="/health" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('healthSummary')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ) : hasData ? (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">{t('today')}</p>
              {mealCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <Utensils className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs">
                    {totalCalories > 0
                      ? `${totalCalories} kcal`
                      : [
                          byType?.breakfast > 0 && t('mealTypeCount', { type: t('mealTypeBreakfast'), count: byType.breakfast }),
                          byType?.lunch > 0 && t('mealTypeCount', { type: t('mealTypeLunch'), count: byType.lunch }),
                          byType?.dinner > 0 && t('mealTypeCount', { type: t('mealTypeDinner'), count: byType.dinner }),
                          byType?.snack > 0 && t('mealTypeCount', { type: t('mealTypeSnack'), count: byType.snack }),
                        ]
                          .filter(Boolean)
                          .join(', ') || t('mealCountFallback', { count: mealCount })}
                  </span>
                </div>
              )}
              {sleepHours !== null && (
                <div className="flex items-center gap-1.5">
                  <Moon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs">{t('sleepHours', { hours: sleepHours })}</span>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Heart />}
              title={t('noHealthYet')}
              description={t('noHealthDesc')}
            />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
