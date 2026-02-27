'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { FoodSearchCombobox } from '@/components/health/food-search-combobox'
import type { MealLog, MealType, CreateMealInput } from '@/types/health'
import type { FoodNutrition } from '@/types/food'

// 식사 유형 메타데이터 (레이블은 번역 키로 처리)
const MEAL_TYPE_VALUES: {
  value: MealType
  activeClass: string
  borderClass: string
}[] = [
  {
    value: 'breakfast',
    activeClass: 'bg-orange-500 text-white border-orange-500',
    borderClass: 'border-orange-300 text-orange-600 hover:bg-orange-50',
  },
  {
    value: 'lunch',
    activeClass: 'bg-green-500 text-white border-green-500',
    borderClass: 'border-green-300 text-green-600 hover:bg-green-50',
  },
  {
    value: 'dinner',
    activeClass: 'bg-blue-500 text-white border-blue-500',
    borderClass: 'border-blue-300 text-blue-600 hover:bg-blue-50',
  },
  {
    value: 'snack',
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
  const t = useTranslations('health.meals')
  const tCommon = useTranslations('common')
  const [mealType, setMealType] = useState<MealType>(meal?.meal_type ?? 'breakfast')
  const [foodName, setFoodName] = useState(meal?.food_name ?? '')
  const [calories, setCalories] = useState(meal?.calories != null ? String(meal.calories) : '')
  const [protein, setProtein] = useState(meal?.protein != null ? String(meal.protein) : '')
  const [carbs, setCarbs] = useState(meal?.carbs != null ? String(meal.carbs) : '')
  const [fat, setFat] = useState(meal?.fat != null ? String(meal.fat) : '')
  const [date, setDate] = useState(meal?.date ?? new Date().toISOString().split('T')[0])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 음식 DB 자동 계산 상태
  const [baseNutrition, setBaseNutrition] = useState<{
    calories: number
    protein: number
    carbs: number
    fat: number
    serving_size: string
    serving_size_g: number
  } | null>(null)
  const [multiplier, setMultiplier] = useState(1)
  const [customMultiplier, setCustomMultiplier] = useState('')

  function parseOptionalNumber(value: string): number | undefined {
    if (value.trim() === '') return undefined
    const num = parseFloat(value)
    return isNaN(num) ? undefined : num
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!foodName.trim()) {
      newErrors.foodName = t('foodNameRequired')
    }

    if (calories !== '' && (isNaN(parseFloat(calories)) || parseFloat(calories) < 0)) {
      newErrors.calories = t('caloriesInvalid')
    }

    if (protein !== '' && (isNaN(parseFloat(protein)) || parseFloat(protein) < 0)) {
      newErrors.protein = t('proteinInvalid')
    }

    if (carbs !== '' && (isNaN(parseFloat(carbs)) || parseFloat(carbs) < 0)) {
      newErrors.carbs = t('carbsInvalid')
    }

    if (fat !== '' && (isNaN(parseFloat(fat)) || parseFloat(fat) < 0)) {
      newErrors.fat = t('fatInvalid')
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      newErrors.date = t('dateInvalid')
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

  function handleFoodSelect(food: FoodNutrition) {
    const base = {
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      serving_size: food.serving_size,
      serving_size_g: food.serving_size_g,
    }
    setBaseNutrition(base)
    setCustomMultiplier('')
    applyMultiplier(1, base)
  }

  function applyMultiplier(
    m: number,
    base?: { calories: number; protein: number; carbs: number; fat: number; serving_size: string; serving_size_g: number }
  ) {
    const src = base ?? baseNutrition
    if (!src) return
    setMultiplier(m)
    setCalories(String(Math.round(src.calories * m)))
    setProtein(String(Math.round(src.protein * m * 10) / 10))
    setCarbs(String(Math.round(src.carbs * m * 10) / 10))
    setFat(String(Math.round(src.fat * m * 10) / 10))
  }

  function handleCustomMultiplierChange(val: string) {
    setCustomMultiplier(val)
    const m = parseFloat(val)
    if (!isNaN(m) && m > 0) {
      applyMultiplier(m)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 식사 유형 선택 버튼 토글 */}
      <div className="space-y-2">
        <Label>{t('type')}</Label>
        <div className="flex gap-2">
          {MEAL_TYPE_VALUES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMealType(option.value)}
              className={cn(
                'flex-1 py-2 px-3 text-sm font-medium rounded-md border transition-colors',
                mealType === option.value ? option.activeClass : option.borderClass
              )}
            >
              {t(`types.${option.value}`)}
            </button>
          ))}
        </div>
      </div>

      {/* 음식명 입력 (필수) — 음식 검색 Combobox */}
      <div className="space-y-2">
        <Label htmlFor="food-name">
          {t('foodName')} <span className="text-destructive">*</span>
        </Label>
        <FoodSearchCombobox
          value={foodName}
          onChange={setFoodName}
          onSelect={handleFoodSelect}
          placeholder={t('foodNamePlaceholder')}
          disabled={isLoading}
        />
        {errors.foodName && (
          <p className="text-xs text-destructive">{errors.foodName}</p>
        )}
      </div>

      {/* 분량 선택 (음식 DB에서 선택한 경우만 표시) */}
      {baseNutrition && (
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          {/* 1인분 기준 정보 */}
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">{t('portion')}</Label>
            <span className="text-xs text-muted-foreground">
              1인분 = {baseNutrition.serving_size} / {baseNutrition.calories} kcal
            </span>
          </div>

          {/* 빠른 선택 버튼 */}
          <div className="flex flex-wrap gap-1.5">
            {[0.5, 1, 2, 3].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setCustomMultiplier(''); applyMultiplier(m) }}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs border font-medium transition-colors',
                  multiplier === m && customMultiplier === ''
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background hover:bg-accent'
                )}
              >
                {m === 1 ? '1인분' : m === 0.5 ? '½인분' : `${m}인분`}
              </button>
            ))}
          </div>

          {/* 직접 입력 */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0.1"
              step="0.5"
              value={customMultiplier}
              onChange={(e) => handleCustomMultiplierChange(e.target.value)}
              placeholder="직접 입력"
              className="h-8 text-sm w-24"
              disabled={isLoading}
            />
            <span className="text-xs text-muted-foreground">인분 (또는 개)</span>
            {customMultiplier !== '' && !isNaN(parseFloat(customMultiplier)) && parseFloat(customMultiplier) > 0 && (
              <span className="text-xs font-medium text-primary ml-auto">
                → {Math.round(baseNutrition.calories * parseFloat(customMultiplier))} kcal
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t('autoFilled')}</p>
        </div>
      )}

      {/* 칼로리 입력 (선택) */}
      <div className="space-y-2">
        <Label htmlFor="calories">{t('caloriesLabel')}</Label>
        <Input
          id="calories"
          type="number"
          min="0"
          step="0.01"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          placeholder={tCommon('optional')}
          disabled={isLoading}
        />
        {errors.calories && (
          <p className="text-xs text-destructive">{errors.calories}</p>
        )}
      </div>

      {/* 영양소 입력 (선택) — 단백질, 탄수화물, 지방 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="protein">{t('proteinLabel')}</Label>
          <Input
            id="protein"
            type="number"
            min="0"
            step="0.1"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder={tCommon('optional')}
            disabled={isLoading}
          />
          {errors.protein && (
            <p className="text-xs text-destructive">{errors.protein}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="carbs">{t('carbsLabel')}</Label>
          <Input
            id="carbs"
            type="number"
            min="0"
            step="0.1"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder={tCommon('optional')}
            disabled={isLoading}
          />
          {errors.carbs && (
            <p className="text-xs text-destructive">{errors.carbs}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="fat">{t('fatLabel')}</Label>
          <Input
            id="fat"
            type="number"
            min="0"
            step="0.1"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            placeholder={tCommon('optional')}
            disabled={isLoading}
          />
          {errors.fat && (
            <p className="text-xs text-destructive">{errors.fat}</p>
          )}
        </div>
      </div>

      {/* 날짜 입력 */}
      <div className="space-y-2">
        <Label htmlFor="date">{tCommon('date')}</Label>
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
            {tCommon('cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? tCommon('saving') : meal ? tCommon('update') : tCommon('add')}
        </Button>
      </div>
    </form>
  )
}
