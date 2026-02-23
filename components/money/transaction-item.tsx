'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/transaction'

interface TransactionItemProps {
  transaction: Transaction
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string, isFavorite: boolean) => void
}

// 금액을 원화 포맷으로 변환
function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

// 날짜 문자열을 MM/DD 형식으로 변환
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${month}/${day}`
}

export function TransactionItem({
  transaction,
  onEdit,
  onDelete,
  onToggleFavorite,
}: TransactionItemProps) {
  const isIncome = transaction.type === 'income'
  const displayLabel = transaction.memo || transaction.category?.name || '미분류'

  return (
    <div className="flex items-center gap-3 py-3 px-4 hover:bg-accent/30 transition-colors group">
      {/* 왼쪽: 카테고리 아이콘 + 배지 */}
      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-muted text-xl">
        {transaction.category?.icon ? (
          <span>{transaction.category.icon}</span>
        ) : (
          <span className="text-muted-foreground text-sm">
            {isIncome ? '↑' : '↓'}
          </span>
        )}
      </div>

      {/* 중간: 카테고리명/메모, 날짜 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{displayLabel}</span>
          {transaction.category && (
            <Badge
              variant="secondary"
              className="text-xs px-1.5 py-0.5 h-auto"
              style={
                transaction.category.color
                  ? { backgroundColor: `${transaction.category.color}20`, color: transaction.category.color }
                  : undefined
              }
            >
              {transaction.category.name}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{formatDate(transaction.date)}</span>
          {transaction.memo && transaction.category && (
            <span className="text-xs text-muted-foreground truncate">{transaction.memo}</span>
          )}
        </div>
      </div>

      {/* 오른쪽: 금액 + 버튼들 */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* 금액 */}
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            isIncome ? 'text-green-600' : 'text-red-600'
          )}
        >
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>

        {/* 즐겨찾기 토글 버튼 */}
        <button
          type="button"
          onClick={() => onToggleFavorite(transaction.id, !transaction.is_favorite)}
          className={cn(
            'ml-1 w-7 h-7 flex items-center justify-center rounded-full transition-colors text-base',
            transaction.is_favorite
              ? 'text-yellow-500'
              : 'text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-yellow-400'
          )}
          aria-label={transaction.is_favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          title={transaction.is_favorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          {transaction.is_favorite ? '★' : '☆'}
        </button>

        {/* 수정/삭제 버튼 (hover 시 표시) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(transaction)}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            수정
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(transaction.id)}
            className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            삭제
          </Button>
        </div>
      </div>
    </div>
  )
}
