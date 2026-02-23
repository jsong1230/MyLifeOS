'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { MealLog, MealType } from '@/types/health'

// 식사 유형 배지 스타일 및 레이블 정의
const MEAL_TYPE_META: Record<MealType, { label: string; badgeClass: string }> = {
  breakfast: { label: '아침', badgeClass: 'bg-orange-100 text-orange-700 border-orange-200' },
  lunch:     { label: '점심', badgeClass: 'bg-green-100 text-green-700 border-green-200' },
  dinner:    { label: '저녁', badgeClass: 'bg-blue-100 text-blue-700 border-blue-200' },
  snack:     { label: '간식', badgeClass: 'bg-purple-100 text-purple-700 border-purple-200' },
}

interface MealItemProps {
  meal: MealLog
  onEdit: (meal: MealLog) => void
  onDelete: (id: string) => void
}

// 개별 식사 기록 항목 컴포넌트
export function MealItem({ meal, onEdit, onDelete }: MealItemProps) {
  const meta = MEAL_TYPE_META[meal.meal_type]

  // 영양소 중 null/undefined 가 아닌 값만 표시
  const nutritionItems: { label: string; value: number }[] = []
  if (meal.protein != null) nutritionItems.push({ label: '단백질', value: meal.protein })
  if (meal.carbs != null) nutritionItems.push({ label: '탄수화물', value: meal.carbs })
  if (meal.fat != null) nutritionItems.push({ label: '지방', value: meal.fat })

  return (
    <div className="flex items-start justify-between py-3 px-1 gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {/* 식사 유형 배지 */}
        <Badge
          variant="outline"
          className={cn('shrink-0 text-xs font-medium', meta.badgeClass)}
        >
          {meta.label}
        </Badge>

        {/* 음식명 및 영양소 정보 */}
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{meal.food_name}</p>

          {/* 영양소 정보 — 입력된 경우에만 표시 */}
          {nutritionItems.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {nutritionItems.map((item, idx) => (
                <span key={item.label}>
                  {idx > 0 && ' · '}
                  {item.label} {item.value}g
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
          aria-label={`${meal.food_name} 수정`}
        >
          수정
        </Button>

        {/* 삭제 버튼 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(meal.id)}
          className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label={`${meal.food_name} 삭제`}
        >
          삭제
        </Button>
      </div>
    </div>
  )
}
