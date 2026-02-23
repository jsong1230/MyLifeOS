'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MealItem } from '@/components/health/meal-item'
import type { MealLog, MealType } from '@/types/health'

// 식사 유형 섹션 순서 및 레이블
const MEAL_TYPE_SECTIONS: { type: MealType; label: string }[] = [
  { type: 'breakfast', label: '아침' },
  { type: 'lunch', label: '점심' },
  { type: 'dinner', label: '저녁' },
  { type: 'snack', label: '간식' },
]

interface MealListProps {
  meals: MealLog[]
  date: string
  onEdit: (meal: MealLog) => void
  onDelete: (id: string) => void
}

// 날짜별 식사 목록 컴포넌트 — 식사 유형별 섹션 그룹화 + 총 칼로리 합산
export function MealList({ meals, onEdit, onDelete }: MealListProps) {
  // 식사 유형별로 그룹화
  const grouped = MEAL_TYPE_SECTIONS.reduce<Record<MealType, MealLog[]>>(
    (acc, { type }) => {
      acc[type] = meals.filter((m) => m.meal_type === type)
      return acc
    },
    { breakfast: [], lunch: [], dinner: [], snack: [] }
  )

  // 총 칼로리 합산 (calories가 있는 항목만)
  const totalCalories = meals.reduce((sum, meal) => {
    return sum + (meal.calories ?? 0)
  }, 0)

  const hasMeals = meals.length > 0

  if (!hasMeals) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground text-sm">오늘 식사 기록이 없습니다</p>
        <p className="text-muted-foreground text-xs mt-1">아래 추가 버튼을 눌러 식사를 기록하세요</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {MEAL_TYPE_SECTIONS.map(({ type, label }) => {
        const sectionMeals = grouped[type]
        if (sectionMeals.length === 0) return null

        return (
          <Card key={type}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-2 pt-0">
              {sectionMeals.map((meal, idx) => (
                <div key={meal.id}>
                  {idx > 0 && <Separator className="my-1" />}
                  <MealItem meal={meal} onEdit={onEdit} onDelete={onDelete} />
                </div>
              ))}
            </CardContent>
          </Card>
        )
      })}

      {/* 총 칼로리 합산 표시 */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold">총 칼로리</span>
          <span className="text-lg font-bold tabular-nums">
            {Math.round(totalCalories).toLocaleString()} kcal
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
