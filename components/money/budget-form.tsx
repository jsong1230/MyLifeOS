'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCategories } from '@/hooks/use-categories'
import { useSettingsStore } from '@/store/settings.store'
import { getCurrencyStep } from '@/lib/currency'
import type { Budget, CreateBudgetInput } from '@/types/budget'

interface BudgetFormProps {
  budget?: Budget
  month: string
  onSubmit: (data: CreateBudgetInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

/**
 * 예산 생성/수정 폼 컴포넌트
 * - category_id: 지출 카테고리 선택 (useCategories('expense') 사용)
 * - amount: 예산 금액 (양수 필수)
 * - year_month: 히든 (props에서 주입)
 */
export function BudgetForm({
  budget,
  month,
  onSubmit,
  onCancel,
  isLoading = false,
}: BudgetFormProps) {
  const t = useTranslations('money.budget')
  const tc = useTranslations('common')
  const currency = useSettingsStore((s) => s.defaultCurrency)

  // 지출 카테고리 목록 조회
  const { data: categories, isLoading: isCategoriesLoading } = useCategories('expense')

  const [categoryId, setCategoryId] = useState<string>(budget?.category_id ?? '')
  const [amount, setAmount] = useState<string>(
    budget?.amount ? String(budget.amount) : ''
  )
  const [errors, setErrors] = useState<Record<string, string>>({})

  // budget prop 변경 시 폼 초기화
  useEffect(() => {
    setCategoryId(budget?.category_id ?? '')
    setAmount(budget?.amount ? String(budget.amount) : '')
    setErrors({})
  }, [budget])

  // 폼 유효성 검사
  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = t('amountError')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 폼 제출 처리
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validate()) return

    const data: CreateBudgetInput = {
      category_id: categoryId || undefined,
      amount: parseFloat(amount),
      year_month: month,
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 카테고리 선택 */}
      <div className="space-y-1.5">
        <Label htmlFor="budget-category">{tc('category')}</Label>
        <Select
          value={categoryId}
          onValueChange={setCategoryId}
          disabled={isLoading || isCategoriesLoading}
        >
          <SelectTrigger id="budget-category">
            <SelectValue placeholder={tc('optional')} />
          </SelectTrigger>
          <SelectContent>
            {(categories ?? []).map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  {cat.icon && <span aria-hidden="true">{cat.icon}</span>}
                  {cat.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 예산 금액 */}
      <div className="space-y-1.5">
        <Label htmlFor="budget-amount">
          {t('amountLabel')} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="budget-amount"
          type="number"
          min={1}
          step={getCurrencyStep(currency)}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t('amountPlaceholder')}
          disabled={isLoading}
          aria-invalid={Boolean(errors.amount)}
        />
        {errors.amount && (
          <p className="text-destructive text-xs">{errors.amount}</p>
        )}
      </div>

      {/* 히든 필드: year_month */}
      <input type="hidden" name="year_month" value={month} readOnly />

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-2">
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
        <Button type="submit" disabled={isLoading || isCategoriesLoading}>
          {isLoading ? tc('saving') : budget ? tc('update') : tc('add')}
        </Button>
      </div>
    </form>
  )
}
