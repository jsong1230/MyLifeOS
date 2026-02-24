'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import type { DietGoal } from '@/types/diet-goal'

// 섭취량 데이터 타입
interface ConsumedNutrients {
  calories: number
  protein?: number
  carbs?: number
  fat?: number
}

interface DietGoalProgressProps {
  goal: DietGoal
  consumed: ConsumedNutrients
}

// 달성률에 따른 진행바 색상 결정
// - 100% 미만(~80%): 초록 / 80~100%: 주황 / 초과(100%+): 빨강
function getProgressColor(percentage: number): string {
  if (percentage > 100) return 'bg-red-500'
  if (percentage >= 80) return 'bg-orange-400'
  return 'bg-green-500'
}

// 숫자를 소수점 1자리로 포맷 (정수면 그대로)
function formatNutrient(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

// 개별 영양소 진행바 컴포넌트
function NutrientBar({
  label,
  consumed,
  goal,
  unit,
}: {
  label: string
  consumed: number
  goal: number
  unit: string
}) {
  const percentage = goal > 0 ? (consumed / goal) * 100 : 0
  const clampedWidth = Math.min(percentage, 100)
  const colorClass = getProgressColor(percentage)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {formatNutrient(consumed)} / {formatNutrient(goal)} {unit}
        </span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colorClass)}
          style={{ width: `${clampedWidth}%` }}
          role="progressbar"
          aria-valuenow={consumed}
          aria-valuemax={goal}
          aria-label={`${label} ${formatNutrient(consumed)}${unit} / ${formatNutrient(goal)}${unit}`}
        />
      </div>
    </div>
  )
}

// 식단 목표 달성 프로그레스 카드
export function DietGoalProgress({ goal, consumed }: DietGoalProgressProps) {
  const t = useTranslations('health.meals')

  // 칼로리 달성률 계산
  const caloriePercentage =
    goal.calorie_goal > 0 ? (consumed.calories / goal.calorie_goal) * 100 : 0
  const clampedCalorieWidth = Math.min(caloriePercentage, 100)
  const calorieColorClass = getProgressColor(caloriePercentage)

  // 목표 초과 여부
  const isExceeded = caloriePercentage > 100

  return (
    <Card className={cn(isExceeded && 'border-red-400')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('caloriesGoalTitle')}</CardTitle>
          {/* AC-03: 목표 초과 시 경고 배지 */}
          {isExceeded && (
            <span
              className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5"
              role="alert"
              aria-live="polite"
            >
              {t('goalExceeded')}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 칼로리 달성률 — AC-02 */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              {t('caloriesConsumed', { calories: consumed.calories.toLocaleString() })}
            </span>
            <span className="text-muted-foreground">
              {t('caloriesGoal', { goal: goal.calorie_goal.toLocaleString() })}
            </span>
          </div>

          {/* 칼로리 메인 프로그레스 바 */}
          <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', calorieColorClass)}
              style={{ width: `${clampedCalorieWidth}%` }}
              role="progressbar"
              aria-valuenow={consumed.calories}
              aria-valuemax={goal.calorie_goal}
              aria-label={`${t('caloriesConsumed', { calories: consumed.calories })} / ${goal.calorie_goal}kcal`}
            />
          </div>

          {/* 달성률 텍스트 */}
          <p
            className={cn(
              'text-xs text-right',
              isExceeded ? 'text-red-600 font-medium' : 'text-muted-foreground'
            )}
          >
            {t('achievePercent', { percent: Math.round(caloriePercentage) })}
            {isExceeded && (
              <span className="ml-1">
                ({t('exceedKcal', { excess: (consumed.calories - goal.calorie_goal).toLocaleString() })})
              </span>
            )}
          </p>
        </div>

        {/* 영양소별 진행바 (목표가 설정된 경우에만 표시) */}
        {(goal.protein_goal != null || goal.carbs_goal != null || goal.fat_goal != null) && (
          <div className="space-y-2 pt-1 border-t">
            <p className="text-xs text-muted-foreground font-medium">{t('nutrientsTitle')}</p>
            {goal.protein_goal != null && (
              <NutrientBar
                label={t('protein')}
                consumed={consumed.protein ?? 0}
                goal={Number(goal.protein_goal)}
                unit="g"
              />
            )}
            {goal.carbs_goal != null && (
              <NutrientBar
                label={t('carbs')}
                consumed={consumed.carbs ?? 0}
                goal={Number(goal.carbs_goal)}
                unit="g"
              />
            )}
            {goal.fat_goal != null && (
              <NutrientBar
                label={t('fat')}
                consumed={consumed.fat ?? 0}
                goal={Number(goal.fat_goal)}
                unit="g"
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
