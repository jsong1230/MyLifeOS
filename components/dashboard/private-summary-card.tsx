'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/empty-state'
import { BookOpen, ChevronRight } from 'lucide-react'
import { EMOTION_ICONS } from '@/types/diary'
import { useDashboardSummary } from '@/hooks/use-dashboard-summary'

// 사적 기록 요약 카드 — 오늘 일기 감정 태그 표시
export function PrivateSummaryCard() {
  const t = useTranslations('dashboard')
  const te = useTranslations('private.emotions')
  const { data, isLoading } = useDashboardSummary()

  const { hasEntry, emotionTags } = data?.diary ?? { hasEntry: false, emotionTags: [] }

  return (
    <Link href="/private" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('privateSummary')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <div className="flex gap-1">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ) : hasEntry ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{t('diaryWritten')}</p>
              <div className="flex flex-wrap gap-1">
                {emotionTags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded-full">
                    {EMOTION_ICONS[tag as keyof typeof EMOTION_ICONS]} {te(tag as Parameters<typeof te>[0])}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<BookOpen />}
              title={t('noDiaryYet')}
              description={t('noDiaryDesc')}
            />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
