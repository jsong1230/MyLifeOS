'use client'

import Link from 'next/link'
import { Sparkles, ChevronRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useAiInsights } from '@/hooks/use-ai-insights'

/**
 * 홈 대시보드용 AI 인사이트 요약 카드
 * 최신 인사이트 1건의 summary만 표시하고, 분석 탭으로 이동 링크 제공
 */
export function AiInsightSummaryCard() {
  const t = useTranslations('insights')
  const tDashboard = useTranslations('dashboard')
  const { data, isLoading } = useAiInsights()

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-purple-500" />
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-10 w-full" />}

        {!isLoading && !data && (
          <p className="text-sm text-muted-foreground">{t('noInsights')}</p>
        )}

        {!isLoading && data?.summary && (
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {data.summary}
          </p>
        )}

        <Link
          href="/reports?tab=ai"
          className="mt-3 flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4"
        >
          {tDashboard('viewAll')}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  )
}
