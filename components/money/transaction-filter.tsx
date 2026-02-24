'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useCategories } from '@/hooks/use-categories'
import type { TransactionFilter } from '@/types/transaction'

interface TransactionFilterProps {
  filter: TransactionFilter
  onChange: (filter: TransactionFilter) => void
}

// YYYY-MM 형식의 월 문자열을 표시용 텍스트로 변환
function formatMonthDisplay(month: string): string {
  const [year, monthNum] = month.split('-')
  return `${year}년 ${parseInt(monthNum, 10)}월`
}

// 현재 월을 YYYY-MM 형식으로 반환
function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// 월을 n개월 이동
function shiftMonth(month: string, delta: number): string {
  const [year, monthStr] = month.split('-').map(Number)
  const date = new Date(year, monthStr - 1 + delta, 1)
  const newYear = date.getFullYear()
  const newMonth = String(date.getMonth() + 1).padStart(2, '0')
  return `${newYear}-${newMonth}`
}

type TypeTab = 'all' | 'income' | 'expense'

export function TransactionFilterBar({ filter, onChange }: TransactionFilterProps) {
  const t = useTranslations('money.transactions.filter')
  const tc = useTranslations('common')
  const currentMonth = filter.month ?? getCurrentMonth()
  const currentType: TypeTab = filter.type ?? 'all'

  const TYPE_TABS: { value: TypeTab; label: string }[] = [
    { value: 'all', label: t('all') },
    { value: 'income', label: t('income') },
    { value: 'expense', label: t('expense') },
  ]

  // 전체 카테고리 목록 조회
  const { data: categories = [] } = useCategories()

  // 현재 타입에 맞는 카테고리 필터링
  const filteredCategories = categories.filter(
    (cat) =>
      currentType === 'all' ||
      cat.type === currentType ||
      cat.type === 'both'
  )

  function handlePrevMonth() {
    onChange({ ...filter, month: shiftMonth(currentMonth, -1), category_id: undefined })
  }

  function handleNextMonth() {
    const next = shiftMonth(currentMonth, 1)
    // 미래 달은 현재 달을 초과하지 않도록 제한
    if (next <= getCurrentMonth()) {
      onChange({ ...filter, month: next, category_id: undefined })
    }
  }

  function handleTypeChange(tab: TypeTab) {
    onChange({
      ...filter,
      type: tab === 'all' ? undefined : tab,
      // 타입 변경 시 카테고리 필터 초기화
      category_id: undefined,
    })
  }

  function handleCategoryChange(value: string) {
    onChange({
      ...filter,
      category_id: value === '_all' ? undefined : value,
    })
  }

  const isNextMonthDisabled = shiftMonth(currentMonth, 1) > getCurrentMonth()

  return (
    <div className="space-y-3 px-4 py-3 border-b bg-background">
      {/* 월 선택 네비게이션 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevMonth}
          className="h-8 px-2"
          aria-label="이전 달"
        >
          &lt;
        </Button>
        <span className="text-sm font-semibold">
          {formatMonthDisplay(currentMonth)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          disabled={isNextMonthDisabled}
          className="h-8 px-2"
          aria-label="다음 달"
        >
          &gt;
        </Button>
      </div>

      {/* 수입/지출/전체 탭 */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg">
        {TYPE_TABS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => handleTypeChange(value)}
            className={cn(
              'flex-1 py-1.5 rounded-md text-sm font-medium transition-colors',
              currentType === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 카테고리 필터 드롭다운 */}
      {filteredCategories.length > 0 && (
        <Select
          value={filter.category_id ?? '_all'}
          onValueChange={handleCategoryChange}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="모든 카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">모든 카테고리</SelectItem>
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
      )}
    </div>
  )
}
