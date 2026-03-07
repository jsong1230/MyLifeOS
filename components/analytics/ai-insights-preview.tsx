'use client'

import Link from 'next/link'
import { Sparkles, ChevronRight, RefreshCw } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAiInsights, useGenerateInsights } from '@/hooks/use-ai-insights'
import type { AiInsight } from '@/app/api/ai/insights/route'

const BG_COLOR: Record<AiInsight['type'], string> = {
  positive:   'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
  warning:    'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
  suggestion: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
}

const BADGE_COLOR: Record<AiInsight['type'], string> = {
  positive:   'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  warning:    'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  suggestion: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
}

function InsightMiniCard({ insight, t }: { insight: AiInsight; t: ReturnType<typeof useTranslations<'insights'>> }) {
  return (
    <div className={`border rounded-lg p-3 ${BG_COLOR[insight.type]}`}>
      <div className="flex items-start gap-2">
        <span className="text-xl shrink-0 leading-none mt-0.5">{insight.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium truncate">{insight.title}</p>
            <Badge className={`text-xs shrink-0 ${BADGE_COLOR[insight.type]}`}>
              {t(`type_${insight.type}`)}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{insight.description}</p>
        </div>
      </div>
    </div>
  )
}

/**
 * 홈 대시보드 AI 인사이트 미리보기 — 최신 인사이트 최대 3개 표시
 */
export function AiInsightsPreview() {
  const t = useTranslations('insights')
  const tDashboard = useTranslations('dashboard')
  const locale = useLocale()
  const { data, isLoading } = useAiInsights()
  const { mutate: generate, isPending } = useGenerateInsights()

  const previewInsights = data?.insights?.slice(0, 3) ?? []

  return (
    <Card className="col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-purple-500" />
            {t('title')}
          </CardTitle>
          <button
            type="button"
            onClick={() => generate(locale)}
            disabled={isPending}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${isPending ? 'animate-spin' : ''}`} />
            {isPending ? t('generating') : t('refresh')}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading && (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        )}

        {!isLoading && previewInsights.length === 0 && (
          <div className="py-4 text-center">
            <p className="text-sm text-muted-foreground">{t('noInsights')}</p>
            <p className="text-xs text-muted-foreground mt-1">{t('noInsightsHint')}</p>
          </div>
        )}

        {!isLoading && previewInsights.map((insight, i) => (
          <InsightMiniCard key={i} insight={insight} t={t} />
        ))}

        <Link
          href="/reports?tab=ai"
          className="flex items-center justify-center gap-1 pt-1 text-xs text-primary hover:underline underline-offset-4"
        >
          {tDashboard('viewAll')}
          <ChevronRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  )
}
