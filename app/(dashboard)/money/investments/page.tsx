'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, ChevronDown, ChevronUp, Trash2 } from 'lucide-react'
import { PortfolioSummary } from '@/components/investments/portfolio-summary'
import { InvestmentCard } from '@/components/investments/investment-card'
import { InvestmentForm } from '@/components/investments/investment-form'
import { TradeForm } from '@/components/investments/trade-form'
import {
  useInvestments,
  useInvestment,
  useCreateInvestment,
  useUpdateInvestment,
  useDeleteInvestment,
  useCreateTrade,
  useDeleteTrade,
} from '@/hooks/use-investments'
import type {
  Investment,
  CreateInvestmentInput,
  UpdateInvestmentInput,
  CreateTradeInput,
} from '@/types/investment'

// 거래 내역 다이얼로그 (내부 컴포넌트)
function TradeHistoryDialog({
  investment,
  open,
  onClose,
}: {
  investment: Investment
  open: boolean
  onClose: () => void
}) {
  const t = useTranslations('money.investments')
  const tc = useTranslations('common')
  const locale = useLocale()
  const { data, isLoading } = useInvestment(open ? investment.id : '')
  const deleteTrade = useDeleteTrade(investment.id)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const transactions = data?.investment_transactions ?? []

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: investment.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(amount)
  }

  function formatDate(dateStr: string): string {
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr))
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('history')} — {investment.ticker}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">{tc('loading')}</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">{tc('noData')}</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-start justify-between gap-2 p-3 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${tx.type === 'buy' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'}`}>
                        {tx.type === 'buy' ? t('buy') : t('sell')}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                    </div>
                    <p className="text-sm mt-1">
                      {Number(tx.shares).toLocaleString(locale, { maximumFractionDigits: 6 })} @{' '}
                      {formatAmount(Number(tx.price))}
                    </p>
                    {tx.fee > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {t('fee')}: {formatAmount(Number(tx.fee))}
                      </p>
                    )}
                    {tx.note && (
                      <p className="text-xs text-muted-foreground">{tx.note}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => setDeleteTarget(tx.id)}
                    disabled={deleteTrade.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tc('delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tc('noData')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteTrade.isPending}>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteTrade.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) })
                }
              }}
              disabled={deleteTrade.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// 투자 트래킹 메인 페이지
export default function InvestmentsPage() {
  const t = useTranslations('money.investments')
  const tc = useTranslations('common')

  // 다이얼로그 상태
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Investment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null)
  const [tradeTarget, setTradeTarget] = useState<Investment | null>(null)
  const [historyTarget, setHistoryTarget] = useState<Investment | null>(null)
  const [showAll, setShowAll] = useState(false)

  // 데이터 조회
  const { data: investments = [], isLoading } = useInvestments()

  // 뮤테이션
  const createMutation = useCreateInvestment()
  const updateMutation = useUpdateInvestment()
  const deleteMutation = useDeleteInvestment()
  const tradeMutation = useCreateTrade(tradeTarget?.id ?? '')

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending

  const displayedInvestments = showAll ? investments : investments.slice(0, 5)

  function handleAddSubmit(data: CreateInvestmentInput | UpdateInvestmentInput) {
    createMutation.mutate(data as CreateInvestmentInput, {
      onSuccess: () => setIsAddOpen(false),
    })
  }

  function handleEditSubmit(data: CreateInvestmentInput | UpdateInvestmentInput) {
    if (!editTarget) return
    updateMutation.mutate(
      { id: editTarget.id, input: data as UpdateInvestmentInput },
      { onSuccess: () => setEditTarget(null) }
    )
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  function handleTradeSubmit(data: CreateTradeInput) {
    if (!tradeTarget) return
    tradeMutation.mutate(data, {
      onSuccess: () => setTradeTarget(null),
    })
  }

  function handleUpdatePrice(id: string, price: number | null) {
    updateMutation.mutate({ id, input: { current_price: price } })
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* 포트폴리오 요약 */}
      <PortfolioSummary investments={investments} />

      {/* 종목 목록 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t('title')} ({investments.length})
        </h2>
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          disabled={isMutating}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          {t('add')}
        </Button>
      </div>

      {/* 종목 목록 */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            {tc('loading')}
          </CardContent>
        </Card>
      ) : investments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">{t('noItems')}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('addFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {displayedInvestments.map((investment) => (
            <div key={investment.id}>
              <InvestmentCard
                investment={investment}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                onTrade={setTradeTarget}
                onUpdatePrice={handleUpdatePrice}
                isUpdating={updateMutation.isPending}
              />
              <button
                type="button"
                onClick={() => setHistoryTarget(investment)}
                className="w-full text-xs text-muted-foreground hover:text-foreground text-center mt-1 py-1"
              >
                {t('history')} →
              </button>
            </div>
          ))}

          {investments.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1 text-muted-foreground"
              onClick={() => setShowAll((prev) => !prev)}
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  {tc('close')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  {tc('more')} ({investments.length - 5})
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* 종목 추가 다이얼로그 */}
      <Dialog open={isAddOpen} onOpenChange={(o) => { if (!o) setIsAddOpen(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('add')}</DialogTitle>
          </DialogHeader>
          <InvestmentForm
            onSubmit={handleAddSubmit}
            onCancel={() => setIsAddOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* 종목 수정 다이얼로그 */}
      <Dialog open={editTarget !== null} onOpenChange={(o) => { if (!o) setEditTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('edit')}</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <InvestmentForm
              investment={editTarget}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditTarget(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 매수/매도 다이얼로그 */}
      <Dialog open={tradeTarget !== null} onOpenChange={(o) => { if (!o) setTradeTarget(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('trade')}</DialogTitle>
          </DialogHeader>
          {tradeTarget && (
            <TradeForm
              investmentName={`${tradeTarget.ticker} — ${tradeTarget.name}`}
              currency={tradeTarget.currency}
              onSubmit={handleTradeSubmit}
              onCancel={() => setTradeTarget(null)}
              isLoading={tradeMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 종목 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? tc('loading') : tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 거래 내역 다이얼로그 */}
      {historyTarget && (
        <TradeHistoryDialog
          investment={historyTarget}
          open={historyTarget !== null}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </div>
  )
}
