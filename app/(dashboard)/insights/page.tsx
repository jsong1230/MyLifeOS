'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAiInsights, useGenerateInsights } from '@/hooks/use-ai-insights'
import type { AiInsight } from '@/app/api/ai/insights/route'

function InsightCard({ insight, t }: { insight: AiInsight; t: ReturnType<typeof useTranslations> }) {
  const bgColorMap: Record<AiInsight['type'], string> = {
    positive: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    warning: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
    suggestion: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  }

  const badgeVariantMap: Record<AiInsight['type'], string> = {
    positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    suggestion: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  }

  return (
    <Card className={`border ${bgColorMap[insight.type]}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">{insight.emoji}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="font-semibold text-sm">{insight.title}</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeVariantMap[insight.type]}`}
              >
                {t(`types.${insight.type}`)}
              </span>
              <Badge variant="outline" className="text-xs">
                {t(`categories.${insight.category}`)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {insight.description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-24 w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function InsightsPage() {
  const t = useTranslations('insights')
  const locale = useLocale()
  const { data: saved, isLoading: isSavedLoading } = useAiInsights()
  const { mutate, data: generated, isPending, error } = useGenerateInsights()

  // 생성된 결과 우선, 없으면 저장된 결과 표시
  const data = generated ?? saved

  const handleGenerate = () => {
    mutate(locale)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 pb-24 md:pb-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">{t('title')}</h1>
        </div>
        {data && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isPending}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? 'animate-spin' : ''}`} />
            {t('regenerate')}
          </Button>
        )}
      </div>

      {/* 초기 로딩 */}
      {isSavedLoading && !isPending && <InsightsSkeleton />}

      {/* 생성 중 */}
      {isPending && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground text-center py-2">{t('generating')}</p>
          <InsightsSkeleton />
        </div>
      )}

      {/* 에러 상태 */}
      {error && !isPending && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            {error.message}
          </CardContent>
        </Card>
      )}

      {/* 결과 표시 */}
      {data && !isPending && (
        <div className="space-y-4">
          {data.summary && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm font-semibold text-primary">
                  {t('summary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm leading-relaxed">{data.summary}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('generatedAt')}:{' '}
                  {new Date(data.generatedAt).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                </p>
              </CardContent>
            </Card>
          )}

          {data.insights.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {data.insights.map((insight, index) => (
                <InsightCard key={index} insight={insight} t={t} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                {t('empty')}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 미생성 상태 */}
      {!data && !isPending && !isSavedLoading && (
        <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
          <div className="rounded-full bg-primary/10 p-6">
            <Sparkles className="w-12 h-12 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="font-semibold text-lg">{t('empty')}</p>
            <p className="text-sm text-muted-foreground max-w-xs">{t('emptyDesc')}</p>
          </div>
          <Button onClick={handleGenerate} size="lg" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {t('generate')}
          </Button>
        </div>
      )}
    </div>
  )
}
