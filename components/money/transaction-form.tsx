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
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { parseAmountInput, formatAmount, CURRENCY_CODES, type CurrencyCode } from '@/lib/currency'
import { useCategories } from '@/hooks/use-categories'
import { useTransactions } from '@/hooks/use-transactions'
import type { Transaction, CreateTransactionInput, TransactionType } from '@/types/transaction'

interface TransactionFormProps {
  transaction?: Transaction
  defaultValues?: {
    amount?: number
    currency?: CurrencyCode
    category_id?: string
    memo?: string
    type?: TransactionType
  }
  onSubmit: (data: CreateTransactionInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

export function TransactionForm({
  transaction,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: TransactionFormProps) {
  const t = useTranslations('money.transactions')
  const tc = useTranslations('common')
  const [type, setType] = useState<TransactionType>(transaction?.type ?? defaultValues?.type ?? 'expense')
  const [currency, setCurrency] = useState<CurrencyCode>(transaction?.currency ?? defaultValues?.currency ?? 'KRW')
  const [amountDisplay, setAmountDisplay] = useState<string>(
    transaction
      ? formatAmount(transaction.amount, transaction.currency ?? 'KRW')
      : defaultValues?.amount
        ? formatAmount(defaultValues.amount, defaultValues.currency ?? 'KRW')
        : ''
  )
  const [date, setDate] = useState<string>(transaction?.date ?? getTodayString())
  const [categoryId, setCategoryId] = useState<string>(transaction?.category_id ?? defaultValues?.category_id ?? '')
  const [memo, setMemo] = useState<string>(transaction?.memo ?? defaultValues?.memo ?? '')
  const [isFavorite, setIsFavorite] = useState<boolean>(transaction?.is_favorite ?? false)
  const [amountError, setAmountError] = useState<string>('')

  // 카테고리 목록 조회 (현재 선택된 타입에 맞는 카테고리 필터링)
  const { data: categories = [] } = useCategories()

  // 타입에 맞는 카테고리만 필터링 (income, expense, both 모두 포함)
  const filteredCategories = categories.filter(
    (cat) => cat.type === type || cat.type === 'both'
  )

  // 즐겨찾기 거래 목록 조회 (빠른 선택용)
  const { data: favoriteTransactions = [] } = useTransactions({ is_favorite: true })

  // 타입 변경 시 현재 카테고리가 해당 타입에 없으면 초기화
  useEffect(() => {
    if (categoryId) {
      const isValid = filteredCategories.some((cat) => cat.id === categoryId)
      if (!isValid) {
        setCategoryId('')
      }
    }
  }, [type, filteredCategories, categoryId])

  // 금액 입력 핸들러 — 통화에 따라 소수점 허용 여부 결정
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (currency === 'KRW') {
      const raw = e.target.value.replace(/[^0-9]/g, '')
      if (raw === '') { setAmountDisplay(''); return }
      const num = parseAmountInput(raw, 'KRW')
      if (!isNaN(num)) setAmountDisplay(formatAmount(num, 'KRW'))
    } else {
      // USD/CAD: 타이핑 중엔 raw 유지 (소수점 2자리까지만 허용)
      const raw = e.target.value.replace(/[^0-9.]/g, '').replace(/^\./, '0.')
      const parts = raw.split('.')
      if (parts.length > 2) return // 소수점 2개 이상 무시
      if (parts[1] !== undefined && parts[1].length > 2) return // 소수점 3자리 이상 무시
      setAmountDisplay(raw)
    }
    setAmountError('')
  }

  // 포커스 아웃 시 포맷 적용 (USD/CAD: "12.5" → "12.50")
  function handleAmountBlur() {
    if (currency === 'KRW' || !amountDisplay) return
    const num = parseAmountInput(amountDisplay, currency)
    if (!isNaN(num) && num > 0) {
      setAmountDisplay(formatAmount(num, currency))
    }
  }

  // 즐겨찾기 항목 선택 시 자동 입력
  function handleFavoriteSelect(favTransaction: Transaction) {
    setType(favTransaction.type)
    const favCurrency = favTransaction.currency ?? 'KRW'
    setCurrency(favCurrency)
    setAmountDisplay(formatAmount(favTransaction.amount, favCurrency))
    setCategoryId(favTransaction.category_id ?? '')
    setMemo(favTransaction.memo ?? '')
    setAmountError('')
  }

  // 폼 제출 핸들러
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const amount = parseAmountInput(amountDisplay, currency)
    if (!amountDisplay || isNaN(amount) || amount <= 0) {
      setAmountError(tc('amount'))
      return
    }

    const data: CreateTransactionInput = {
      amount,
      type,
      category_id: categoryId || undefined,
      memo: memo.trim() || undefined,
      date,
      is_favorite: isFavorite,
      currency,
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 즐겨찾기 빠른 선택 */}
      {favoriteTransactions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{t('quickSelect')}</Label>
          <div className="flex flex-wrap gap-2">
            {favoriteTransactions.map((fav) => (
              <button
                key={fav.id}
                type="button"
                onClick={() => handleFavoriteSelect(fav)}
                className={cn(
                  'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  fav.type === 'income'
                    ? 'border-green-200 text-green-700 bg-green-50'
                    : 'border-red-200 text-red-700 bg-red-50'
                )}
              >
                {fav.category?.icon && <span>{fav.category.icon}</span>}
                <span>{fav.category?.name ?? fav.memo ?? tc('none')}</span>
                <span className="font-semibold">{formatAmount(fav.amount, fav.currency ?? 'KRW')}</span>
              </button>
            ))}
          </div>
          <Separator />
        </div>
      )}

      {/* 수입/지출 타입 토글 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={cn(
            'flex-1 py-3 rounded-lg font-semibold text-base transition-colors border-2',
            type === 'expense'
              ? 'bg-red-500 text-white border-red-500'
              : 'bg-background text-muted-foreground border-border hover:border-red-300'
          )}
        >
          {t('expense')}
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={cn(
            'flex-1 py-3 rounded-lg font-semibold text-base transition-colors border-2',
            type === 'income'
              ? 'bg-green-500 text-white border-green-500'
              : 'bg-background text-muted-foreground border-border hover:border-green-300'
          )}
        >
          {t('income')}
        </button>
      </div>

      {/* 금액 + 통화 입력 */}
      <div className="space-y-1.5">
        <Label htmlFor="amount">
          {tc('amount')} <span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-2">
          <Select value={currency} onValueChange={(v) => setCurrency(v as CurrencyCode)}>
            <SelectTrigger className="w-24 shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCY_CODES.map((code) => (
                <SelectItem key={code} value={code}>{code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Input
              id="amount"
              type="text"
              inputMode={currency === 'KRW' ? 'numeric' : 'decimal'}
              placeholder="0"
              value={amountDisplay}
              onChange={handleAmountChange}
              onBlur={handleAmountBlur}
              className={cn('pr-2', amountError && 'border-destructive')}
            />
          </div>
        </div>
        {amountError && (
          <p className="text-xs text-destructive">{amountError}</p>
        )}
      </div>

      {/* 날짜 입력 */}
      <div className="space-y-1.5">
        <Label htmlFor="date">{tc('date')}</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* 카테고리 선택 */}
      <div className="space-y-1.5">
        <Label htmlFor="category">{tc('category')}</Label>
        <Select
          value={categoryId}
          onValueChange={(val) => setCategoryId(val === '_none' ? '' : val)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder={t('categoryPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">{t('categoryNone')}</SelectItem>
            {filteredCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-2">
                  {cat.icon && <span>{cat.icon}</span>}
                  <span>{cat.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 메모 입력 */}
      <div className="space-y-1.5">
        <Label htmlFor="memo">{tc('memo')}</Label>
        <Input
          id="memo"
          type="text"
          placeholder={t('memoPlaceholder')}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          maxLength={200}
        />
      </div>

      {/* 즐겨찾기 체크박스 */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="is_favorite"
          checked={isFavorite}
          onCheckedChange={(checked) => setIsFavorite(checked === true)}
        />
        <Label htmlFor="is_favorite" className="cursor-pointer font-normal">
          {t('favoriteLabel')}
        </Label>
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-2 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            {tc('cancel')}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          className={cn(
            'flex-1',
            type === 'income'
              ? 'bg-green-500 hover:bg-green-600 text-white'
              : 'bg-red-500 hover:bg-red-600 text-white'
          )}
        >
          {isLoading ? tc('loading') : transaction ? tc('update') : tc('add')}
        </Button>
      </div>
    </form>
  )
}
