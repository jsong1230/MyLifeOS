'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent } from '@/components/ui/card'
import type { RoutineStreak } from '@/hooks/use-streaks'

type StreakBadge = {
  days: number
  emoji: string
  labelKey: 'badge_7' | 'badge_30' | 'badge_100'
}

const STREAK_BADGES: StreakBadge[] = [
  { days: 100, emoji: '🥇', labelKey: 'badge_100' },
  { days: 30, emoji: '🥈', labelKey: 'badge_30' },
  { days: 7, emoji: '🥉', labelKey: 'badge_7' },
]

function getStreakColor(streak: number): string {
  if (streak === 0) return 'text-muted-foreground'
  if (streak < 7) return 'text-orange-500'
  return 'text-red-500'
}

function getStreakEmoji(streak: number): string {
  if (streak === 0) return ''
  return '🔥'
}

type Props = {
  routine: RoutineStreak
}

export function StreakCard({ routine }: Props) {
  const t = useTranslations('streaks')

  const earnedBadges = STREAK_BADGES.filter(
    (badge) => routine.longest_streak >= badge.days
  )

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{routine.name}</p>
            <div className="flex items-center gap-3 mt-2">
              <div>
                <p className="text-xs text-muted-foreground">{t('current_streak')}</p>
                <p className={`text-2xl font-bold ${getStreakColor(routine.current_streak)}`}>
                  {getStreakEmoji(routine.current_streak)}{routine.current_streak}
                  <span className="text-sm font-normal ml-1">{t('days')}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('longest_streak')}</p>
                <p className="text-lg font-semibold text-foreground">
                  {routine.longest_streak}
                  <span className="text-sm font-normal ml-1">{t('days')}</span>
                </p>
              </div>
            </div>
            {routine.current_streak === 0 && (
              <p className="text-xs text-muted-foreground mt-1">{t('no_streak')}</p>
            )}
          </div>
          {earnedBadges.length > 0 && (
            <div className="flex flex-col items-end gap-1 shrink-0">
              {earnedBadges.map((badge) => (
                <span
                  key={badge.days}
                  title={t(badge.labelKey)}
                  className="text-lg"
                  aria-label={t(badge.labelKey)}
                >
                  {badge.emoji}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
