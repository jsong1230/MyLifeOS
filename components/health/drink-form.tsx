'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { DrinkLog, DrinkType, CreateDrinkInput } from '@/types/health'

// 주종별 기본 도수(%) 자동 입력값
const DRINK_DEFAULT_PCT: Record<DrinkType, number> = {
  beer: 5,
  soju: 16,
  wine: 12,
  whiskey: 40,
  other: 0,
}

// 주종 선택 버튼 메타데이터 (이모지 포함)
const DRINK_TYPE_OPTIONS: {
  value: DrinkType
  emoji: string
  activeClass: string
  borderClass: string
}[] = [
  {
    value: 'beer',
    emoji: '🍺',
    activeClass: 'bg-amber-500 text-white border-amber-500',
    borderClass: 'border-amber-300 text-amber-600 hover:bg-amber-50',
  },
  {
    value: 'soju',
    emoji: '🥃',
    activeClass: 'bg-green-500 text-white border-green-500',
    borderClass: 'border-green-300 text-green-600 hover:bg-green-50',
  },
  {
    value: 'wine',
    emoji: '🍷',
    activeClass: 'bg-red-500 text-white border-red-500',
    borderClass: 'border-red-300 text-red-600 hover:bg-red-50',
  },
  {
    value: 'whiskey',
    emoji: '🥃',
    activeClass: 'bg-orange-500 text-white border-orange-500',
    borderClass: 'border-orange-300 text-orange-600 hover:bg-orange-50',
  },
  {
    value: 'other',
    emoji: '🍶',
    activeClass: 'bg-slate-500 text-white border-slate-500',
    borderClass: 'border-slate-300 text-slate-600 hover:bg-slate-50',
  },
]

interface DrinkFormProps {
  drink?: DrinkLog
  onSubmit: (data: CreateDrinkInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 음주 기록 생성/수정 폼 컴포넌트
// 주종 선택 시 도수 기본값 자동 입력
export function DrinkForm({ drink, onSubmit, onCancel, isLoading = false }: DrinkFormProps) {
  const t = useTranslations('health.drinks')
  const tc = useTranslations('common')
  const tv = useTranslations('validation')
  const [drinkType, setDrinkType] = useState<DrinkType>(drink?.drink_type ?? 'beer')
  const [amountMl, setAmountMl] = useState(drink?.amount_ml != null ? String(drink.amount_ml) : '')
  const [alcoholPct, setAlcoholPct] = useState(
    drink?.alcohol_pct != null
      ? String(drink.alcohol_pct)
      : String(DRINK_DEFAULT_PCT['beer'])
  )
  const [drinkCount, setDrinkCount] = useState(
    drink?.drink_count != null ? String(drink.drink_count) : ''
  )
  const [date, setDate] = useState(drink?.date ?? new Date().toISOString().split('T')[0])
  const [note, setNote] = useState(drink?.note ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 주종 변경 시 기본 도수 자동 입력 (기존 값이 비어있거나 기본값과 같을 때만)
  function handleDrinkTypeChange(newType: DrinkType) {
    const prevDefault = DRINK_DEFAULT_PCT[drinkType]
    const currentPct = parseFloat(alcoholPct)

    // 현재 도수가 이전 주종의 기본값과 같거나 비어있으면 새 기본값으로 교체
    if (alcoholPct === '' || currentPct === prevDefault) {
      setAlcoholPct(String(DRINK_DEFAULT_PCT[newType]))
    }

    setDrinkType(newType)
  }

  // 숫자 필드 파싱 헬퍼
  function parseOptionalNumber(value: string): number | undefined {
    if (value.trim() === '') return undefined
    const num = parseFloat(value)
    return isNaN(num) ? undefined : num
  }

  // 폼 검증
  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (amountMl.trim() === '') {
      newErrors.amountMl = t('amountRequired')
    } else if (isNaN(parseFloat(amountMl)) || parseFloat(amountMl) <= 0) {
      newErrors.amountMl = t('amountPositive')
    }

    if (alcoholPct !== '') {
      const pct = parseFloat(alcoholPct)
      if (isNaN(pct) || pct < 0 || pct > 100) {
        newErrors.alcoholPct = t('alcoholInvalid')
      }
    }

    if (drinkCount !== '') {
      const count = parseFloat(drinkCount)
      if (isNaN(count) || count < 0) {
        newErrors.drinkCount = t('drinkCountInvalid')
      }
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      newErrors.date = tv('invalidDate')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      drink_type: drinkType,
      amount_ml: parseFloat(amountMl),
      alcohol_pct: parseOptionalNumber(alcoholPct),
      drink_count: parseOptionalNumber(drinkCount),
      date,
      note: note.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 주종 선택 버튼 토글 */}
      <div className="space-y-2">
        <Label>{t('type')}</Label>
        <div className="flex gap-1.5 flex-wrap">
          {DRINK_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleDrinkTypeChange(option.value)}
              className={cn(
                'flex-1 min-w-[60px] py-2 px-2 text-sm font-medium rounded-md border transition-colors',
                drinkType === option.value ? option.activeClass : option.borderClass
              )}
            >
              <span className="mr-1">{option.emoji}</span>
              {t(`types.${option.value}` as Parameters<typeof t>[0])}
            </button>
          ))}
        </div>
      </div>

      {/* 음주량(ml) 입력 (필수) */}
      <div className="space-y-2">
        <Label htmlFor="amount-ml">
          ml <span className="text-destructive">*</span>
        </Label>
        <Input
          id="amount-ml"
          type="number"
          min="0"
          step="0.1"
          value={amountMl}
          onChange={(e) => setAmountMl(e.target.value)}
          placeholder="예: 355"
          disabled={isLoading}
        />
        {errors.amountMl && (
          <p className="text-xs text-destructive">{errors.amountMl}</p>
        )}
      </div>

      {/* 도수와 잔 수 — 2열 레이아웃 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 도수(%) 입력 (선택, 주종 선택 시 기본값 자동 입력) */}
        <div className="space-y-2">
          <Label htmlFor="alcohol-pct">% ABV</Label>
          <Input
            id="alcohol-pct"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={alcoholPct}
            onChange={(e) => setAlcoholPct(e.target.value)}
            placeholder="예: 5.0"
            disabled={isLoading}
          />
          {errors.alcoholPct && (
            <p className="text-xs text-destructive">{errors.alcoholPct}</p>
          )}
        </div>

        {/* 잔 수 입력 (선택) */}
        <div className="space-y-2">
          <Label htmlFor="drink-count">{t('amount')}</Label>
          <Input
            id="drink-count"
            type="number"
            min="0"
            step="0.5"
            value={drinkCount}
            onChange={(e) => setDrinkCount(e.target.value)}
            placeholder="예: 2"
            disabled={isLoading}
          />
          {errors.drinkCount && (
            <p className="text-xs text-destructive">{errors.drinkCount}</p>
          )}
        </div>
      </div>

      {/* 날짜 입력 */}
      <div className="space-y-2">
        <Label htmlFor="drink-date">{tc('date')}</Label>
        <Input
          id="drink-date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={isLoading}
        />
        {errors.date && (
          <p className="text-xs text-destructive">{errors.date}</p>
        )}
      </div>

      {/* 메모 입력 (선택) */}
      <div className="space-y-2">
        <Label htmlFor="drink-note">{tc('memo')}</Label>
        <Input
          id="drink-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={tc('optional')}
          disabled={isLoading}
        />
      </div>

      {/* 폼 버튼 */}
      <div className="flex gap-2 justify-end pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {tc('cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? tc('loading') : drink ? tc('update') : tc('add')}
        </Button>
      </div>
    </form>
  )
}
