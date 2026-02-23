'use client'

import { useState, useEffect } from 'react'
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
import type { RecurringExpense, CreateRecurringInput, RecurringCycle } from '@/types/recurring'

interface RecurringFormProps {
  expense?: RecurringExpense
  onSubmit: (data: CreateRecurringInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 결제일 옵션 (1-31)
const BILLING_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => i + 1)

/**
 * 정기 지출 생성/수정 폼 컴포넌트
 * - 이름: 필수 텍스트
 * - 금액: 양수 필수
 * - 결제일: 1-31 선택
 * - 주기: monthly / yearly 토글
 * - 카테고리: 선택사항
 */
export function RecurringForm({
  expense,
  onSubmit,
  onCancel,
  isLoading = false,
}: RecurringFormProps) {
  // 지출 카테고리 목록 조회
  const { data: categories, isLoading: isCategoriesLoading } = useCategories('expense')

  const [name, setName] = useState<string>(expense?.name ?? '')
  const [amount, setAmount] = useState<string>(
    expense?.amount ? String(expense.amount) : ''
  )
  const [billingDay, setBillingDay] = useState<string>(
    expense?.billing_day ? String(expense.billing_day) : '1'
  )
  const [cycle, setCycle] = useState<RecurringCycle>(expense?.cycle ?? 'monthly')
  const [categoryId, setCategoryId] = useState<string>(expense?.category_id ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // expense prop 변경 시 폼 초기화
  useEffect(() => {
    setName(expense?.name ?? '')
    setAmount(expense?.amount ? String(expense.amount) : '')
    setBillingDay(expense?.billing_day ? String(expense.billing_day) : '1')
    setCycle(expense?.cycle ?? 'monthly')
    setCategoryId(expense?.category_id ?? '')
    setErrors({})
  }, [expense])

  // 폼 유효성 검사
  function validate(): boolean {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = '이름을 입력해주세요'
    }

    const parsedAmount = parseFloat(amount)
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = '0보다 큰 금액을 입력해주세요'
    }

    const parsedDay = parseInt(billingDay, 10)
    if (isNaN(parsedDay) || parsedDay < 1 || parsedDay > 31) {
      newErrors.billingDay = '결제일은 1에서 31 사이의 값이어야 합니다'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 폼 제출 처리
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!validate()) return

    const data: CreateRecurringInput = {
      name: name.trim(),
      amount: parseFloat(amount),
      billing_day: parseInt(billingDay, 10),
      cycle,
      category_id: categoryId || undefined,
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 이름 */}
      <div className="space-y-1.5">
        <Label htmlFor="recurring-name">
          이름 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="recurring-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 넷플릭스, 헬스장 회비"
          disabled={isLoading}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name && (
          <p className="text-destructive text-xs">{errors.name}</p>
        )}
      </div>

      {/* 금액 */}
      <div className="space-y-1.5">
        <Label htmlFor="recurring-amount">
          금액 (원) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="recurring-amount"
          type="number"
          min={1}
          step={100}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="예: 13900"
          disabled={isLoading}
          aria-invalid={Boolean(errors.amount)}
        />
        {errors.amount && (
          <p className="text-destructive text-xs">{errors.amount}</p>
        )}
      </div>

      {/* 결제일 */}
      <div className="space-y-1.5">
        <Label htmlFor="recurring-billing-day">
          결제일 <span className="text-destructive">*</span>
        </Label>
        <Select
          value={billingDay}
          onValueChange={setBillingDay}
          disabled={isLoading}
        >
          <SelectTrigger id="recurring-billing-day" aria-invalid={Boolean(errors.billingDay)}>
            <SelectValue placeholder="결제일 선택" />
          </SelectTrigger>
          <SelectContent>
            {BILLING_DAY_OPTIONS.map((day) => (
              <SelectItem key={day} value={String(day)}>
                매월 {day}일
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.billingDay && (
          <p className="text-destructive text-xs">{errors.billingDay}</p>
        )}
      </div>

      {/* 주기 토글 */}
      <div className="space-y-1.5">
        <Label>주기</Label>
        <div className="flex rounded-md border overflow-hidden">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              cycle === 'monthly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setCycle('monthly')}
            disabled={isLoading}
          >
            매월
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              cycle === 'yearly'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setCycle('yearly')}
            disabled={isLoading}
          >
            매년
          </button>
        </div>
      </div>

      {/* 카테고리 (선택사항) */}
      <div className="space-y-1.5">
        <Label htmlFor="recurring-category">카테고리</Label>
        <Select
          value={categoryId}
          onValueChange={setCategoryId}
          disabled={isLoading || isCategoriesLoading}
        >
          <SelectTrigger id="recurring-category">
            <SelectValue placeholder="카테고리 선택 (선택사항)" />
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

      {/* 버튼 */}
      <div className="flex justify-end gap-2 pt-2">
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
        <Button type="submit" disabled={isLoading || isCategoriesLoading}>
          {isLoading ? '저장 중...' : expense ? '수정' : '추가'}
        </Button>
      </div>
    </form>
  )
}
