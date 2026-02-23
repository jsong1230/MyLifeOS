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
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useCategories } from '@/hooks/use-categories'
import { useTransactions } from '@/hooks/use-transactions'
import type { Transaction, CreateTransactionInput, TransactionType } from '@/types/transaction'

interface TransactionFormProps {
  transaction?: Transaction
  onSubmit: (data: CreateTransactionInput) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

// 숫자 문자열에서 콤마 제거 후 숫자로 변환
function parseAmount(value: string): number {
  return Number(value.replace(/,/g, ''))
}

// 숫자를 천 단위 콤마 포맷으로 변환
function formatAmount(value: number | string): string {
  const num = typeof value === 'string' ? parseAmount(value) : value
  if (isNaN(num)) return ''
  return num.toLocaleString('ko-KR')
}

export function TransactionForm({
  transaction,
  onSubmit,
  onCancel,
  isLoading = false,
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense')
  const [amountDisplay, setAmountDisplay] = useState<string>(
    transaction ? formatAmount(transaction.amount) : ''
  )
  const [date, setDate] = useState<string>(transaction?.date ?? getTodayString())
  const [categoryId, setCategoryId] = useState<string>(transaction?.category_id ?? '')
  const [memo, setMemo] = useState<string>(transaction?.memo ?? '')
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

  // 금액 입력 핸들러 — 숫자만 허용, 천 단위 콤마 자동 포맷
  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/[^0-9]/g, '')
    if (raw === '') {
      setAmountDisplay('')
      return
    }
    const num = parseInt(raw, 10)
    setAmountDisplay(num.toLocaleString('ko-KR'))
    setAmountError('')
  }

  // 즐겨찾기 항목 선택 시 자동 입력
  function handleFavoriteSelect(favTransaction: Transaction) {
    setType(favTransaction.type)
    setAmountDisplay(formatAmount(favTransaction.amount))
    setCategoryId(favTransaction.category_id ?? '')
    setMemo(favTransaction.memo ?? '')
    setAmountError('')
  }

  // 폼 제출 핸들러
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const amount = parseAmount(amountDisplay)
    if (!amountDisplay || isNaN(amount) || amount <= 0) {
      setAmountError('금액을 올바르게 입력해주세요')
      return
    }

    const data: CreateTransactionInput = {
      amount,
      type,
      category_id: categoryId || undefined,
      memo: memo.trim() || undefined,
      date,
      is_favorite: isFavorite,
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 즐겨찾기 빠른 선택 */}
      {favoriteTransactions.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">즐겨찾기에서 빠른 선택</Label>
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
                <span>{fav.category?.name ?? fav.memo ?? '미분류'}</span>
                <span className="font-semibold">{formatAmount(fav.amount)}원</span>
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
          지출
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
          수입
        </button>
      </div>

      {/* 금액 입력 */}
      <div className="space-y-1.5">
        <Label htmlFor="amount">
          금액 <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="amount"
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={amountDisplay}
            onChange={handleAmountChange}
            className={cn('pr-8', amountError && 'border-destructive')}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            원
          </span>
        </div>
        {amountError && (
          <p className="text-xs text-destructive">{amountError}</p>
        )}
      </div>

      {/* 날짜 입력 */}
      <div className="space-y-1.5">
        <Label htmlFor="date">날짜</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* 카테고리 선택 */}
      <div className="space-y-1.5">
        <Label htmlFor="category">카테고리</Label>
        <Select
          value={categoryId}
          onValueChange={(val) => setCategoryId(val === '_none' ? '' : val)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="카테고리 선택 (선택사항)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">선택 안함</SelectItem>
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
        <Label htmlFor="memo">메모</Label>
        <Input
          id="memo"
          type="text"
          placeholder="메모 입력 (선택사항)"
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
          즐겨찾기에 추가 (자주 사용하는 항목)
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
            취소
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
          {isLoading ? '저장 중...' : transaction ? '수정하기' : '추가하기'}
        </Button>
      </div>
    </form>
  )
}
