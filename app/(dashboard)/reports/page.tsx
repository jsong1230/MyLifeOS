'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ChevronLeft, ChevronRight, Sparkles, RefreshCw } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { formatDateToString } from '@/lib/date-utils'
import { useWeeklyReport, useMonthlyReport } from '@/hooks/use-reports'
import { useAiInsights, useGenerateInsights } from '@/hooks/use-ai-insights'
import { WeeklyReportView } from '@/components/reports/weekly-report'
import { MonthlyReportView } from '@/components/reports/monthly-report'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { AiInsight } from '@/app/api/ai/insights/route'

// 목표/투자 탭은 초기 화면에 노출되지 않으므로 lazy load — 초기 JS 번들 분리
const GoalsTab = dynamic(
  () => import('@/components/goals/goals-tab').then((m) => ({ default: m.GoalsTab })),
  { loading: () => <Skeleton className="h-64 w-full" /> }
)
// 오늘 날짜 기준으로 이번 주 월요일(주 시작) 반환 (YYYY-MM-DD)
function getCurrentWeekStart(): string {
  const today = new Date()
  const day = today.getDay() // 0=일, 1=월, ..., 6=토
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  return formatDateToString(monday)
}

// YYYY-MM-DD 날짜에 N일을 더한 날짜 반환
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return formatDateToString(date)
}

// YYYY-MM-DD 형식의 주 시작일을 로케일 기반 주 범위 문자열로 변환
function formatWeekLabel(weekStart: string, locale: string): string {
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(start.getDate() + 6)

  const fmt = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' })
  return `${fmt.format(start)} ~ ${fmt.format(end)}`
}

// 연/월 로케일 기반 포맷
function formatMonthLabel(year: number, month: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    new Date(year, month - 1, 1)
  )
}

// 탭 타입
type TabType = 'weekly' | 'monthly' | 'goals' | 'ai'

function InsightCard({ insight, t }: { insight: AiInsight; t: ReturnType<typeof useTranslations<'insights'>> }) {
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
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${badgeVariantMap[insight.type]}`}>
                {t(`types.${insight.type}`)}
              </span>
              <Badge variant="outline" className="text-xs">
                {t(`categories.${insight.category}`)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ReportsPage() {
  const locale = useLocale()
  const t = useTranslations()
  const ti = useTranslations('insights')
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tab = searchParams.get('tab')
    if (tab === 'ai' || tab === 'weekly' || tab === 'monthly' || tab === 'goals') {
      return tab as TabType
    }
    return 'weekly'
  })

  // AI 인사이트
  const { data: savedInsights, isLoading: insightsLoading } = useAiInsights()
  const { mutate: generateInsights, data: generatedInsights, isPending: isGenerating } = useGenerateInsights()
  const insightsData = generatedInsights ?? savedInsights

  // 주간 — 현재 주 시작일 상태
  const [weekStart, setWeekStart] = useState<string>(getCurrentWeekStart)

  // 월간 — 현재 연/월 상태
  const [year, setYear] = useState<number>(() => new Date().getFullYear())
  const [month, setMonth] = useState<number>(() => new Date().getMonth() + 1)

  // 주간 네비게이션
  const goToPrevWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, -7))
  }, [])

  const goToNextWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, 7))
  }, [])

  // 월간 네비게이션
  const goToPrevMonth = useCallback(() => {
    setYear((y) => (month === 1 ? y - 1 : y))
    setMonth((m) => (m === 1 ? 12 : m - 1))
  }, [month])

  const goToNextMonth = useCallback(() => {
    setYear((y) => (month === 12 ? y + 1 : y))
    setMonth((m) => (m === 12 ? 1 : m + 1))
  }, [month])

  // 리포트 데이터 조회
  const {
    data: weeklyData,
    isLoading: weeklyLoading,
    isError: weeklyError,
  } = useWeeklyReport(activeTab === 'weekly' ? weekStart : '')

  const {
    data: monthlyData,
    isLoading: monthlyLoading,
    isError: monthlyError,
  } = useMonthlyReport(
    activeTab === 'monthly' ? year : 0,
    activeTab === 'monthly' ? month : 0
  )

  return (
    <div className="px-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-5">{t('nav.reports')}</h1>

      {/* ── 탭 전환 ── */}
      <div className="flex bg-muted rounded-lg p-1 mb-6">
        {(['weekly', 'monthly', 'goals', 'ai'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-1 ${
              activeTab === tab
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-pressed={activeTab === tab}
          >
            {tab === 'ai' && <Sparkles className="w-3 h-3" />}
            {tab === 'weekly'
              ? t('reports.weeklyTab')
              : tab === 'monthly'
              ? t('reports.monthlyTab')
              : tab === 'goals'
              ? t('nav.goals')
              : ti('title')}
          </button>
        ))}
      </div>

      {/* ── 주간 탭 ── */}
      {activeTab === 'weekly' && (
        <>
          {/* 주 탐색 헤더 */}
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={goToPrevWeek}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label={t('common.prevWeek')}
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <span className="text-sm font-medium">{formatWeekLabel(weekStart, locale)}</span>
            <button
              type="button"
              onClick={goToNextWeek}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label={t('common.nextWeek')}
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* 주간 리포트 콘텐츠 */}
          {weeklyLoading && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          )}
          {weeklyError && (
            <div className="py-16 text-center text-sm text-destructive">
              {t('reports.loadError')}
            </div>
          )}
          {weeklyData && <WeeklyReportView report={weeklyData} />}
        </>
      )}

      {/* ── 월간 탭 ── */}
      {activeTab === 'monthly' && (
        <>
          {/* 월 탐색 헤더 */}
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label={t('common.prevMonth')}
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <span className="text-sm font-medium">{formatMonthLabel(year, month, locale)}</span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label={t('common.nextMonth')}
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* 월간 리포트 콘텐츠 */}
          {monthlyLoading && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          )}
          {monthlyError && (
            <div className="py-16 text-center text-sm text-destructive">
              {t('reports.loadError')}
            </div>
          )}
          {monthlyData && <MonthlyReportView report={monthlyData} />}
        </>
      )}

      {/* ── 목표 탭 ── */}
      {activeTab === 'goals' && <GoalsTab />}

      {/* ── AI 인사이트 탭 ── */}
      {activeTab === 'ai' && (
        <div className="space-y-4 pb-24 md:pb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{ti('emptyDesc')}</p>
            {insightsData && (
              <Button variant="outline" size="sm" onClick={() => generateInsights(locale)} disabled={isGenerating} className="flex items-center gap-1.5 shrink-0">
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                {ti('regenerate')}
              </Button>
            )}
          </div>

          {/* 로딩 */}
          {(insightsLoading || isGenerating) && (
            <div className="space-y-3">
              {isGenerating && <p className="text-sm text-muted-foreground text-center py-1">{ti('generating')}</p>}
              <Skeleton className="h-24 w-full rounded-lg" />
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)}
              </div>
            </div>
          )}

          {/* 결과 */}
          {insightsData && !isGenerating && (
            <div className="space-y-4">
              {insightsData.summary && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-semibold text-primary">{ti('summary')}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <p className="text-sm leading-relaxed">{insightsData.summary}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {ti('generatedAt')}: {new Date(insightsData.generatedAt).toLocaleString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                    </p>
                  </CardContent>
                </Card>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {insightsData.insights.map((insight, i) => <InsightCard key={i} insight={insight} t={ti} />)}
              </div>
            </div>
          )}

          {/* 미생성 */}
          {!insightsData && !insightsLoading && !isGenerating && (
            <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
              <div className="rounded-full bg-primary/10 p-6">
                <Sparkles className="w-12 h-12 text-primary" />
              </div>
              <Button onClick={() => generateInsights(locale)} size="lg" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {ti('generate')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
