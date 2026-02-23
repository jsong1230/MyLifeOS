'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { MealLog, MealType, CreateMealInput } from '@/types/health'

// 식사 유형 메타데이터 정의
const MEAL_TYPE_OPTIONS: {
  value: MealType
  label: string
  activeClass: string
  borderClass: string
}[] = [
  {
    value: 'breakfast',
    label: '아침',
    activeClass: 'bg-orange-500 text-white border-orange-500',
    borderClass: 'border-orange-300 text-orange-600 hover:bg-orange-50',
  },
  {
    value: 'lunch',
    label: '점심',
    activeClass: 'bg-green-500 text-white border-green-500',
    borderClass: 'border-green-300 text-green-600 hover:bg-green-50',
  },
  {
    value: 'dinner',
    label: '저녁',
    activeClass: 'bg-blue-500 text-white border-blue-500',
    borderClass: 'border-blue-300 text-blue-600 hover:bg-blue-50',
  },
  {
    value: 'snack',
    label: '간식',
    activeClass: 'bg-purple-500 text-white border-purple-500',
    borderClass: 'border-purple-300 text-purple-600 hover:bg-purple-50',
  },
]

interface MealFormProps {
  meal?: MealLog
  onSubmit: (data: CreateMealInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 식사 기록 생성/수정 폼 컴포넌트
export function MealForm({ meal, onSubmit, onCancel, isLoading = false }: MealFormProps) {
  const [mealType, setMealType] = useState<MealType>(meal?.meal_type ?? 'breakfast')
  const [foodName, setFoodName] = useState(meal?.food_name ?? '')
  const [calories, setCalories] = useState(meal?.calories != null ? String(meal.calories) : '')
  const [protein, setProtein] = useState(meal?.protein != null ? String(meal.protein) : '')
  const [carbs, setCarbs] = useState(meal?.carbs != null ? String(meal.carbs) : '')
  const [fat, setFat] = useState(meal?.fat != null ? String(meal.fat) : '')
  const [date, setDate] = useState(meal?.date ?? new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 숫자 필드 파싱 헬퍼
  function parseOptionalNumber(value: string): number | undefined {
    if (value.trim() === '') return undefined
    const num = parseFloat(value)
    return isNaN(num) ? undefined : num
  }

  // 폼 검증
  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!foodName.trim()) {
      newErrors.foodName = '음식명을 입력하세요'
    }

    if (calories !== '' && (isNaN(parseFloat(calories)) || parseFloat(calories) < 0)) {
      newErrors.calories = '칼로리는 0 이상의 숫자여야 합니다'
    }

    if (protein !== '' && (isNaN(parseFloat(protein)) || parseFloat(protein) < 0)) {
      newErrors.protein = '단백질은 0 이상의 숫자여야 합니다'
    }

    if (carbs !== '' && (isNaN(parseFloat(carbs)) || parseFloat(carbs) < 0)) {
      newErrors.carbs = '탄수화물은 0 이상의 숫자여야 합니다'
    }

    if (fat !== '' && (isNaN(parseFloat(fat)) || parseFloat(fat) < 0)) {
      newErrors.fat = '지방은 0 이상의 숫자여야 합니다'
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      newErrors.date = '날짜 형식이 올바르지 않습니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      meal_type: mealType,
      food_name: foodName.trim(),
      calories: parseOptionalNumber(calories),
      protein: parseOptionalNumber(protein),
      carbs: parseOptionalNumber(carbs),
      fat: parseOptionalNumber(fat),
      date,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 식사 유형 선택 버튼 토글 */}
      <div className="space-y-2">
        <Label>식사 유형</Label>
        <div className="flex gap-2">
          {MEAL_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMealType(option.value)}
              className={cn(
                'flex-1 py-2 px-3 text-sm font-medium rounded-md border transition-colors',
                mealType === option.value ? option.activeClass : option.borderClass
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* 음식명 입력 (필수) */}
      <div className="space-y-2">
        <Label htmlFor="food-name">
          음식명 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="food-name"
          value={foodName}
          onChange={(e) => setFoodName(e.target.value)}
          placeholder="음식명을 입력하세요"
          disabled={isLoading}
        />
        {errors.foodName && (
          <p className="text-xs text-destructive">{errors.foodName}</p>
        )}
      </div>

      {/* 칼로리 입력 (선택) */}
      <div className="space-y-2">
        <Label htmlFor="calories">칼로리 (kcal)</Label>
        <Input
          id="calories"
          type="number"
          min="0"
          step="0.01"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder="칼로리 (선택)"
          disabled={isLoading}
        />
        {errors.calories && (
          <p className="text-xs text-destructive">{errors.calories}</p>
        )}
      </div>

      {/* 영양소 입력 (선택) — 단백질, 탄수화물, 지방 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="protein">단백질 (g)</Label>
          <Input
            id="protein"
            type="number"
            min="0"
            step="0.1"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="선택"
            disabled={isLoading}
          />
          {errors.protein && (
            <p className="text-xs text-destructive">{errors.protein}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="carbs">탄수화물 (g)</Label>
          <Input
            id="carbs"
            type="number"
            min="0"
            step="0.1"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="선택"
            disabled={isLoading}
          />
          {errors.carbs && (
            <p className="text-xs text-destructive">{errors.carbs}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="fat">지방 (g)</Label>
          <Input
            id="fat"
            type="number"
            min="0"
            step="0.1"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            placeholder="선택"
            disabled={isLoading}
          />
          {errors.fat && (
            <p className="text-xs text-destructive">{errors.fat}</p>
          )}
        </div>
      </div>

      {/* 날짜 입력 */}
      <div className="space-y-2">
        <Label htmlFor="date">날짜</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isLoading}
        />
        {errors.date && (
          <p className="text-xs text-destructive">{errors.date}</p>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            취소
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '저장 중...' : meal ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  )
}
