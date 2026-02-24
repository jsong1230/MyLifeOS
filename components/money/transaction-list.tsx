'use client'

import { useTranslations, useLocale } from 'next-intl'
import { Separator } from '@/components/ui/separator'
import { TransactionItem } from './transaction-item'
import { formatCurrency, calcTotalsByCurrency, type CurrencyCode } from '@/lib/currency'
import type { Transaction } from '@/types/transaction'

interface TransactionListProps {
  transactions: Transaction[]
  onEdit: (transaction: Transaction) => void
  onDelete: (id: string) => void
  onToggleFavorite: (id: string, isFavorite: boolean) => void
}

// 날짜를 그룹 헤더용 포맷으로 변환 (로케일 기반)
function formatDateHeader(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date)
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
  const t = useTranslations('money.transactions')
  const locale = useLocale()

  // 빈 상태 처리
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <span className="text-4xl mb-3">💸</span>
        <p className="text-sm">{t('noData')}</p>
        <p className="text-xs mt-1">{t('noDataHint')}</p>
      </div>
    )
  }

  // 날짜별 그룹화
  const groupedTransactions = groupTransactionsByDate(transactions)

  // 통화별 수입/지출 합계
  const totalsByCurrency = calcTotalsByCurrency(transactions)

  return (
    <div className="flex flex-col">
      {/* 날짜별 그룹 렌더링 */}
      {Array.from(groupedTransactions.entries()).map(([date, dayTransactions]) => {
        const dayTotals = calcTotalsByCurrency(dayTransactions)

        return (
          <div key={date}>
            {/* 날짜 헤더 */}
            <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
              <span className="text-xs font-medium text-muted-foreground">
                {formatDateHeader(date, locale)}
              </span>
              <div className="flex items-center gap-2 text-xs">
                {Object.entries(dayTotals).map(([currency, { income, expense }]) => (
                  <span key={currency} className="flex gap-1">
                    {income > 0 && (
                      <span className="text-green-600 font-medium">
                        +{formatCurrency(income, currency as CurrencyCode)}
                      </span>
                    )}
                    {expense > 0 && (
                      <span className="text-red-600 font-medium">
                        -{formatCurrency(expense, currency as CurrencyCode)}
                      </span>
                    )}
                  </span>
                ))}
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

      {/* 하단 합계 요약 — 통화별 분리 */}
      <Separator className="my-2" />
      <div className="px-4 py-3 bg-muted/30 space-y-3">
        {Object.entries(totalsByCurrency).map(([currency, { income, expense }]) => {
          const balance = income - expense
          return (
            <div key={currency}>
              {Object.keys(totalsByCurrency).length > 1 && (
                <p className="text-xs font-semibold text-muted-foreground mb-1">{currency}</p>
              )}
              {income > 0 && (
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{t('totalIncome')}</span>
                  <span className="text-green-600 font-medium">+{formatCurrency(income, currency as CurrencyCode)}</span>
                </div>
              )}
              {expense > 0 && (
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">{t('totalExpense')}</span>
                  <span className="text-red-600 font-medium">-{formatCurrency(expense, currency as CurrencyCode)}</span>
                </div>
              )}
              <Separator className="my-1" />
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>{t('balance')}</span>
                <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {balance >= 0 ? '+' : ''}{formatCurrency(Math.abs(balance), currency as CurrencyCode)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
