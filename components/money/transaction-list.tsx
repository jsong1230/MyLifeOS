'use client'

import { Separator } from '@/components/ui/separator'
import { TransactionItem } from './transaction-item'
import type { Transaction } from '@/types/transaction'

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string, isFavorite: boolean) => void
}

// 날짜를 그룹 헤더용 포맷으로 변환 (예: 2024년 1월 15일 (월))
function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const dayName = dayNames[date.getDay()]
  return `${year}년 ${month}월 ${day}일 (${dayName})`
}

// 금액을 원화 포맷으로 변환
function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

// 날짜별로 거래 목록 그룹화
function groupTransactionsByDate(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>()
  for (const tx of transactions) {
    const existing = groups.get(tx.date)
    if (existing) {
      existing.push(tx)
    } else {
      groups.set(tx.date, [tx])
    }
  }
  return groups
}

export function TransactionList({
  transactions,
  onEdit,
  onDelete,
  onToggleFavorite,
}: TransactionListProps) {
  // 빈 상태 처리
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <span className="text-4xl mb-3">💸</span>
        <p className="text-sm">거래 내역이 없습니다</p>
        <p className="text-xs mt-1">+ 버튼을 눌러 거래를 추가해보세요</p>
      </div>
    )
  }

  // 날짜별 그룹화
  const groupedTransactions = groupTransactionsByDate(transactions)

  // 수입/지출 합계 계산
  let totalIncome = 0
  let totalExpense = 0
  for (const tx of transactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount
    } else {
      totalExpense += tx.amount
    }
  }
  const balance = totalIncome - totalExpense

  return (
    <div className="flex flex-col">
      {/* 날짜별 그룹 렌더링 */}
      {Array.from(groupedTransactions.entries()).map(([date, dayTransactions]) => {
        // 해당 날짜의 합계 계산
        let dayIncome = 0
        let dayExpense = 0
        for (const tx of dayTransactions) {
          if (tx.type === 'income') {
            dayIncome += tx.amount
          } else {
            dayExpense += tx.amount
          }
        }

        return (
          <div key={date}>
            {/* 날짜 헤더 */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground">
                {formatDateHeader(date)}
              </span>
              <div className="flex items-center gap-2 text-xs">
                {dayIncome > 0 && (
                  <span className="text-green-600 font-medium">
                    +{formatCurrency(dayIncome)}
                  </span>
                )}
                {dayExpense > 0 && (
                  <span className="text-red-600 font-medium">
                    -{formatCurrency(dayExpense)}
                  </span>
                )}
              </div>
            </div>

            {/* 해당 날짜 거래 목록 */}
            {dayTransactions.map((tx, idx) => (
              <div key={tx.id}>
                <TransactionItem
                  transaction={tx}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onToggleFavorite={onToggleFavorite}
                />
                {idx < dayTransactions.length - 1 && (
                  <Separator className="mx-4" />
                )}
              </div>
            ))}
          </div>
        )
      })}

      {/* 하단 합계 요약 */}
      <Separator className="my-2" />
      <div className="px-4 py-3 bg-muted/30">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">수입 합계</span>
          <span className="text-green-600 font-medium">+{formatCurrency(totalIncome)}</span>
        </div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-muted-foreground">지출 합계</span>
          <span className="text-red-600 font-medium">-{formatCurrency(totalExpense)}</span>
        </div>
        <Separator className="my-2" />
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>잔액</span>
          <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
            {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
          </span>
        </div>
      </div>
    </div>
  )
}
