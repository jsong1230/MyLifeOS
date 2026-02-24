'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Wallet, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react'
import type { Transaction } from '@/types/transaction'

function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ko-KR').format(amount)
}

// 금전 모듈 요약 카드 — 이번 달 수입/지출 합계
export function MoneySummaryCard() {
  const month = getCurrentMonth()

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['transactions', month],
    queryFn: async () => {
      const res = await fetch(`/api/transactions?month=${month}`)
      const json = await res.json() as { success: boolean; data: Transaction[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '거래 조회 실패')
      return json.data
    },
  })

  const income = transactions?.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0) ?? 0
  const expense = transactions?.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0) ?? 0
  const hasData = (transactions?.length ?? 0) > 0

  return (
    <Link href="/money" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">금전 관리</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">불러오는 중...</p>
          ) : hasData ? (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">이번 달</p>
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                <span className="text-xs text-green-600">수입 {formatAmount(income)}원</span>
              </div>
              <div className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-500" />
                <span className="text-xs text-red-600">지출 {formatAmount(expense)}원</span>
              </div>
              <div className="pt-1 border-t">
                <span
                  className={`text-sm font-semibold ${
                    income - expense >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {income - expense >= 0 ? '+' : ''}
                  {formatAmount(income - expense)}원
                </span>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Wallet />}
              title="이번 달 지출 기록이 없어요"
              description="지출을 기록하고 예산을 관리해보세요"
            />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
