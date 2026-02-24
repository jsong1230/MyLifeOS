'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { MealLog, MealType } from '@/types/health'

// 식사 유형 배지 스타일 정의
const MEAL_TYPE_BADGE: Record<MealType, { badgeClass: string }> = {
  breakfast: { badgeClass: 'bg-orange-100 text-orange-700 border-orange-200' },
  lunch:     { badgeClass: 'bg-green-100 text-green-700 border-green-200' },
  dinner:    { badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
  snack:     { badgeClass: 'bg-purple-100 text-purple-700 border-purple-200' },
}

interface MealItemProps {
  meal: MealLog
  onEdit: (meal: MealLog) => void
  onDelete: (id: string) => void
}

// 개별 식사 기록 항목 컴포넌트
export function MealItem({ meal, onEdit, onDelete }: MealItemProps) {
  const t = useTranslations('health.meals')
  const tCommon = useTranslations('common')
  const badgeMeta = MEAL_TYPE_BADGE[meal.meal_type]

  // 영양소 중 null/undefined 가 아닌 값만 표시
  const nutritionItems: { labelKey: string; value: number }[] = []
  if (meal.protein != null) nutritionItems.push({ labelKey: 'protein', value: meal.protein })
  if (meal.carbs != null) nutritionItems.push({ labelKey: 'carbs', value: meal.carbs })
  if (meal.fat != null) nutritionItems.push({ labelKey: 'fat', value: meal.fat })

  return (
    <div className="flex items-start justify-between py-3 px-1 gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {/* 식사 유형 배지 */}
        <Badge
          variant="outline"
          className={cn('shrink-0 text-xs font-medium', badgeMeta.badgeClass)}
        >
          {t(`types.${meal.meal_type}`)}
        </Badge>

        {/* 음식명 및 영양소 정보 */}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{meal.food_name}</p>

          {/* 영양소 정보 — 입력된 경우에만 표시 */}
          {nutritionItems.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {nutritionItems.map((item, idx) => (
                <span key={item.labelKey}>
                  {idx > 0 && ' · '}
                  {t(item.labelKey)} {item.value}g
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* 칼로리 표시 */}
        {meal.calories != null && (
          <span className="text-sm font-semibold tabular-nums">
            {Math.round(meal.calories).toLocaleString()} kcal
          </span>
        )}

        {/* 수정 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(meal)}
          className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          aria-label={`${meal.food_name} ${tCommon('edit')}`}
        >
          {tCommon('edit')}
        </Button>

        {/* 삭제 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(meal.id)}
          className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label={`${meal.food_name} ${tCommon('delete')}`}
        >
          {tCommon('delete')}
        </Button>
      </div>
    </div>
  )
}
