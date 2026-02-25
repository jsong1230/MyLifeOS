'use client'

import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { useMeals } from '@/hooks/use-meals'
import { useDrinks } from '@/hooks/use-drinks'
import { useSleep } from '@/hooks/use-sleep'
import { useDietGoal } from '@/hooks/use-diet-goal'
import { CalorieCard } from '@/components/health/calorie-card'
import { DrinkWeeklyCard } from '@/components/health/drink-weekly-card'
import { SleepWeeklyCard } from '@/components/health/sleep-weekly-card'

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

// 주 시작일(월요일) 계산 — 일요일(0)인 경우 -6일, 나머지는 1 - 요일값
function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay() // 0=일
  const diff = day === 0 ? -6 : 1 - day // 월요일 기준
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

// 주간 레이블 포맷 (locale 기반)
function formatWeekLabel(weekStart: string, locale: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)

  if (locale === 'ko') {
    const startLabel = `${start.getMonth() + 1}월 ${start.getDate()}일`
    const endLabel = `${end.getMonth() + 1}월 ${end.getDate()}일`
    return `${startLabel} ~ ${endLabel}`
  }

  // 영어: e.g. "Feb 19 – Feb 25"
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

// 카드 스켈레톤 — 로딩 중 표시
function CardSkeleton() {
  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-3 bg-muted rounded w-1/4" />
      </div>
      <div className="mt-6 space-y-2">
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-3 bg-muted rounded w-full" />
        <div className="h-3 bg-muted rounded w-3/4" />
      </div>
    </div>
  )
}

// 바로가기 링크 컴포넌트
function DetailLink({ href, label }: { href: string; label: string }) {
  const t = useTranslations()
  return (
    <Link
      href={href}
      className={cn(
        'block text-center text-sm text-primary hover:underline py-2',
        'border-t border-border mt-2'
      )}
    >
      {label} &rarr; {t('health.detailLink')}
    </Link>
  )
}

// 건강 대시보드 페이지
export default function HealthPage() {
  const t = useTranslations()
  const locale = useLocale()
  const today = getTodayString()
  const weekStart = getWeekStart()
  const weekLabel = formatWeekLabel(weekStart, locale)

  // 네 가지 쿼리를 병렬 조회
  const mealsQuery = useMeals(today)
  const drinksQuery = useDrinks(weekStart)
  const sleepQuery = useSleep(weekStart)
  const dietGoalQuery = useDietGoal()

  // 음주 기록에서 잔 수 합산 (WHO 기준 경고용)
  const totalDrinkCount =
    drinksQuery.data?.data.reduce(
      (sum, log) => sum + (log.drink_count ?? 0),
      0
    ) ?? undefined

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-xl font-semibold">{t('health.dashboardTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t('health.dashboardDateRef', { date: today.replace(/-/g, '.') })}
        </p>
      </div>

      {/* 식단 목표 설정 버튼 */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {dietGoalQuery.data
            ? t('health.meals.calorieGoalDisplay', { kcal: dietGoalQuery.data.calorie_goal.toLocaleString() })
            : t('health.meals.noGoalSet')}
        </p>
        <Link
          href="/health/diet-goal"
          className={cn(
            'text-sm font-medium px-3 py-1.5 rounded-md border transition-colors',
            'border-primary text-primary hover:bg-primary hover:text-primary-foreground'
          )}
        >
          {dietGoalQuery.data ? t('health.meals.editGoal') : t('health.meals.setGoal')}
        </Link>
      </div>

      {/* 카드 그리드 — 모바일 1열 / md:2열 / lg:3열 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* AC-01: 오늘 총 칼로리 카드 */}
        <div className="flex flex-col">
          {mealsQuery.isLoading ? (
            <CardSkeleton />
          ) : (
            <CalorieCard
              meals={mealsQuery.data ?? []}
              date={today}
            />
          )}
          <DetailLink href="/health/meals" label={t('health.meals.title')} />
        </div>

        {/* AC-02: 이번 주 음주 카드 */}
        <div className="flex flex-col">
          {drinksQuery.isLoading ? (
            <CardSkeleton />
          ) : (
            <DrinkWeeklyCard
              summary={
                drinksQuery.data?.summary ?? { count: 0, total_ml: 0 }
              }
              weekLabel={weekLabel}
              totalDrinkCount={
                totalDrinkCount !== undefined && totalDrinkCount > 0
                  ? totalDrinkCount
                  : undefined
              }
            />
          )}
          <DetailLink href="/health/drinks" label={t('health.drinks.title')} />
        </div>

        {/* AC-03: 최근 7일 평균 수면 카드 */}
        <div className="flex flex-col">
          {sleepQuery.isLoading ? (
            <CardSkeleton />
          ) : (
            <SleepWeeklyCard
              summary={
                sleepQuery.data?.summary ?? { avg_hours: 0, avg_quality: 0 }
              }
              logs={sleepQuery.data?.data ?? []}
            />
          )}
          <DetailLink href="/health/sleep" label={t('health.sleep.title')} />
        </div>
      </div>
    </div>
  )
}
