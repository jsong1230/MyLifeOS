'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { DietGoal, UpsertDietGoalInput } from '@/types/diet-goal'

interface DietGoalFormProps {
  // 기존 목표 데이터 (수정 시 초기값으로 사용)
  goal?: DietGoal | null
  onSubmit: (data: UpsertDietGoalInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 식단 목표 설정 폼 — 칼로리(필수), 단백질/탄수화물/지방(선택)
export function DietGoalForm({ goal, onSubmit, onCancel, isLoading = false }: DietGoalFormProps) {
  const t = useTranslations('health.meals')
  const tCommon = useTranslations('common')

  const [calorieGoal, setCalorieGoal] = useState<string>(
    goal?.calorie_goal ? String(goal.calorie_goal) : ''
  )
  const [proteinGoal, setProteinGoal] = useState<string>(
    goal?.protein_goal != null ? String(goal.protein_goal) : ''
  )
  const [carbsGoal, setCarbsGoal] = useState<string>(
    goal?.carbs_goal != null ? String(goal.carbs_goal) : ''
  )
  const [fatGoal, setFatGoal] = useState<string>(
    goal?.fat_goal != null ? String(goal.fat_goal) : ''
  )
  const [error, setError] = useState<string>('')

  // 폼 제출 처리
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    // 칼로리 필수 검증
    const parsedCalorie = parseInt(calorieGoal, 10)
    if (!calorieGoal || isNaN(parsedCalorie) || parsedCalorie <= 0) {
      setError(t('caloriesRequired'))
      return
    }

    // 선택 필드 파싱
    const parsedProtein = proteinGoal ? parseFloat(proteinGoal) : undefined
    const parsedCarbs = carbsGoal ? parseFloat(carbsGoal) : undefined
    const parsedFat = fatGoal ? parseFloat(fatGoal) : undefined

    // 선택 필드 유효성 검증
    if (parsedProtein !== undefined && (isNaN(parsedProtein) || parsedProtein < 0)) {
      setError(t('proteinGoalInvalid'))
      return
    }
    if (parsedCarbs !== undefined && (isNaN(parsedCarbs) || parsedCarbs < 0)) {
      setError(t('carbsGoalInvalid'))
      return
    }
    if (parsedFat !== undefined && (isNaN(parsedFat) || parsedFat < 0)) {
      setError(t('fatGoalInvalid'))
      return
    }

    const input: UpsertDietGoalInput = {
      calorie_goal: parsedCalorie,
      ...(parsedProtein !== undefined && { protein_goal: parsedProtein }),
      ...(parsedCarbs !== undefined && { carbs_goal: parsedCarbs }),
      ...(parsedFat !== undefined && { fat_goal: parsedFat }),
    }

    onSubmit(input)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 칼로리 목표 (필수) */}
      <div className="space-y-1.5">
        <Label htmlFor="calorie_goal">
          {t('goalCaloriesLabel')} <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="calorie_goal"
            type="number"
            min={1}
            step={1}
            placeholder={t('caloriesGoalPlaceholder')}
            value={calorieGoal}
            onChange={(e) => {
              setCalorieGoal(e.target.value)
              setError('')
            }}
            disabled={isLoading}
            required
            className="pr-14"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            kcal
          </span>
        </div>
      </div>

      {/* 단백질 목표 (선택) */}
      <div className="space-y-1.5">
        <Label htmlFor="protein_goal">{t('proteinGoalLabel')}</Label>
        <div className="relative">
          <Input
            id="protein_goal"
            type="number"
            min={0}
            step={0.1}
            placeholder={t('proteinPlaceholder')}
            value={proteinGoal}
            onChange={(e) => {
              setProteinGoal(e.target.value)
              setError('')
            }}
            disabled={isLoading}
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            g
          </span>
        </div>
      </div>

      {/* 탄수화물 목표 (선택) */}
      <div className="space-y-1.5">
        <Label htmlFor="carbs_goal">{t('carbsGoalLabel')}</Label>
        <div className="relative">
          <Input
            id="carbs_goal"
            type="number"
            min={0}
            step={0.1}
            placeholder={t('carbsPlaceholder')}
            value={carbsGoal}
            onChange={(e) => {
              setCarbsGoal(e.target.value)
              setError('')
            }}
            disabled={isLoading}
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            g
          </span>
        </div>
      </div>

      {/* 지방 목표 (선택) */}
      <div className="space-y-1.5">
        <Label htmlFor="fat_goal">{t('fatGoalLabel')}</Label>
        <div className="relative">
          <Input
            id="fat_goal"
            type="number"
            min={0}
            step={0.1}
            placeholder={t('fatPlaceholder')}
            value={fatGoal}
            onChange={(e) => {
              setFatGoal(e.target.value)
              setError('')
            }}
            disabled={isLoading}
            className="pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
            g
          </span>
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* 버튼 영역 */}
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            {tCommon('cancel')}
          </Button>
        )}
        <Button
          type="submit"
          className={onCancel ? 'flex-1' : 'w-full'}
          disabled={isLoading}
        >
          {isLoading ? tCommon('saving') : t('saveGoal')}
        </Button>
      </div>
    </form>
  )
}
