'use client'

import { useTranslations } from 'next-intl'
import { useStreaks, useActivityHeatmap } from '@/hooks/use-streaks'
import { StreakCard } from '@/components/time/streak-card'
import { ActivityHeatmap } from '@/components/time/activity-heatmap'
import { StreakAchievements } from '@/components/time/streak-achievements'

export default function StreakDashboardPage() {
  const t = useTranslations('streaks')
  const tc = useTranslations('common')

  const { data: streaksData, isLoading: streaksLoading } = useStreaks()
  const { data: heatmapData, isLoading: heatmapLoading } = useActivityHeatmap()

  const isLoading = streaksLoading || heatmapLoading

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold">{t('title')}</h1>

      {isLoading && (
        <div className="flex justify-center py-8">
          <span className="text-muted-foreground text-sm">{tc('loading')}</span>
        </div>
      )}

      {!isLoading && (
        <>
          {/* 성취 배지 */}
          <StreakAchievements routines={streaksData?.routines ?? []} />

          {/* 활동 히트맵 */}
          {heatmapData && (
            <ActivityHeatmap
              todoEntries={heatmapData.todo_heatmap}
              routineEntries={heatmapData.routine_heatmap}
            />
          )}

          {/* 루틴 스트릭 카드 목록 */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">{t('current_streak')}</h2>
            {(!streaksData?.routines || streaksData.routines.length === 0) ? (
              <p className="text-sm text-muted-foreground py-4 text-center">{t('empty')}</p>
            ) : (
              <div className="space-y-3">
                {streaksData.routines.map((routine) => (
                  <StreakCard key={routine.id} routine={routine} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
