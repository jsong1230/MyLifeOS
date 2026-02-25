'use client'

import { useTranslations, useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import type { MealLog, MealType } from '@/types/health'

// 식사 유형별 색상 (div 기반 미니 바)
const MEAL_TYPE_COLORS: Record<MealType, string> = {
  breakfast: 'bg-blue-400',
  lunch: 'bg-green-400',
  dinner: 'bg-orange-400',
  snack: 'bg-purple-400',
}

// 식사 유형 순서
const MEAL_TYPE_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

interface CalorieCardProps {
  meals: MealLog[]
  date: string
}

// 오늘 총 칼로리 섭취량 카드
export function CalorieCard({ meals, date }: CalorieCardProps) {
  const t = useTranslations('health.meals')
  const tCommon = useTranslations()
  const locale = useLocale()

  // 총 칼로리 합산
  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories ?? 0), 0)

  // 식사 유형별 칼로리 합산
  const caloriesByType = MEAL_TYPE_ORDER.reduce<Record<MealType, number>>(
    (acc, type) => {
      acc[type] = meals
        .filter((meal) => meal.meal_type === type)
        .reduce((sum, meal) => sum + (meal.calories ?? 0), 0)
      return acc
    },
    { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
  )

  // 날짜 포맷 (YYYY-MM-DD → locale 기반)
  const [, month, day] = date.split('-')
  const dateLabel = locale === 'ko'
    ? `${parseInt(month)}월 ${parseInt(day)}일`
    : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(date + 'T00:00:00'))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-lg">🍽️</span>
          {t('caloriesTodayTitle')}
        </CardTitle>
        <CardDescription>{tCommon('health.dashboardDateRef', { date: dateLabel })}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {meals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('noFoodToday')}
          </p>
        ) : (
          <>
            {/* 총 칼로리 */}
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold">
                {totalCalories.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">kcal</span>
            </div>

            {/* 식사 유형별 미니 바 시각화 */}
            <div className="space-y-2">
              {MEAL_TYPE_ORDER.map((type) => {
                const calories = caloriesByType[type]
                if (calories === 0) return null

                const percentage =
                  totalCalories > 0
                    ? Math.max(4, Math.round((calories / totalCalories) * 100))
                    : 0

                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{t(`types.${type}`)}</span>
                      <span>{calories.toLocaleString()} kcal</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', MEAL_TYPE_COLORS[type])}
                        style={{ width: `${percentage}%` }}
                        role="progressbar"
                        aria-valuenow={calories}
                        aria-valuemax={totalCalories}
                        aria-label={`${t(`types.${type}`)} ${calories}kcal`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 식사 횟수 */}
            <p className="text-xs text-muted-foreground">
              {t('mealCount', { count: meals.length })}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
