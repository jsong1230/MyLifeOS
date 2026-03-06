'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { RoutineStreak } from '@/hooks/use-streaks'

type BadgeConfig = {
  days: number
  emoji: string
  labelKey: 'badge_7' | 'badge_30' | 'badge_100'
}

const BADGE_CONFIGS: BadgeConfig[] = [
  { days: 7, emoji: '🥉', labelKey: 'badge_7' },
  { days: 30, emoji: '🥈', labelKey: 'badge_30' },
  { days: 100, emoji: '🥇', labelKey: 'badge_100' },
]

type Props = {
  routines: RoutineStreak[]
}

export function StreakAchievements({ routines }: Props) {
  const t = useTranslations('streaks')

  // 전체 루틴 중 최장 스트릭 최대값
  const maxLongest = routines.reduce((max, r) => Math.max(max, r.longest_streak), 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t('achievements')}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-4">
          {BADGE_CONFIGS.map((badge) => {
            const earned = maxLongest >= badge.days
            return (
              <div
                key={badge.days}
                className={`flex flex-col items-center gap-1 flex-1 p-3 rounded-lg border transition-opacity ${
                  earned
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-muted opacity-40 grayscale'
                }`}
              >
                <span className="text-3xl" aria-hidden="true">
                  {badge.emoji}
                </span>
                <span className="text-xs font-medium text-center leading-tight">
                  {t(badge.labelKey)}
                </span>
                {earned && (
                  <span className="text-[10px] text-primary font-semibold">✓</span>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
