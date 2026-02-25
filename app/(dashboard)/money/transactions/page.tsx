'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
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
import { TransactionFilterBar } from '@/components/money/transaction-filter'
import { TransactionList } from '@/components/money/transaction-list'
import { TransactionForm } from '@/components/money/transaction-form'
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/hooks/use-transactions'
import type {
  Transaction,
  TransactionFilter,
  CreateTransactionInput,
  UpdateTransactionInput,
} from '@/types/transaction'

// 현재 월을 YYYY-MM 형식으로 반환
function getCurrentMonth(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function TransactionsPage() {
  const t = useTranslations('money.transactions')
  const tc = useTranslations('common')
  // 필터 상태 — 기본값: 현재 월
  const [filter, setFilter] = useState<TransactionFilter>({
    month: getCurrentMonth(),
  })

  // 다이얼로그 상태
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 데이터 훅
  const { data: transactions = [], isLoading } = useTransactions(filter)
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()

  // 거래 추가 다이얼로그 열기
  function handleOpenCreate() {
    setEditingTransaction(undefined)
    setIsFormOpen(true)
  }

  // 거래 수정 다이얼로그 열기
  function handleEdit(transaction: Transaction) {
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  // 거래 삭제 확인 다이얼로그 열기
  function handleDeleteRequest(id: string) {
    setDeletingId(id)
  }

  // 즐겨찾기 토글
  function handleToggleFavorite(id: string, isFavorite: boolean) {
    const input: UpdateTransactionInput = { is_favorite: isFavorite }
    updateMutation.mutate({ id, input })
  }

  // 폼 제출 처리 (생성/수정 분기)
  function handleFormSubmit(data: CreateTransactionInput) {
    if (editingTransaction) {
      // 수정
      const input: UpdateTransactionInput = {
        amount: data.amount,
        type: data.type,
        category_id: data.category_id ?? null,
        memo: data.memo ?? null,
        date: data.date,
        is_favorite: data.is_favorite,
      }
      updateMutation.mutate(
        { id: editingTransaction.id, input },
        {
          onSuccess: () => {
            setIsFormOpen(false)
            setEditingTransaction(undefined)
          },
        }
      )
    } else {
      // 생성
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false)
        },
      })
    }
  }

  // 삭제 확정
  function handleDeleteConfirm() {
    if (!deletingId) return
    deleteMutation.mutate(deletingId, {
      onSuccess: () => {
        setDeletingId(null)
      },
    })
  }

  // 다이얼로그 닫기
  function handleFormCancel() {
    setIsFormOpen(false)
    setEditingTransaction(undefined)
  }

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending

  return (
    <div className="flex flex-col h-full">
      {/* 필터 바 */}
      <TransactionFilterBar filter={filter} onChange={setFilter} />

      {/* 거래 목록 */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <span className="text-sm">{tc('loading')}</span>
          </div>
        ) : (
          <TransactionList
            transactions={transactions}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </div>

      {/* 거래 추가 플로팅 버튼 */}
      <div className="fixed bottom-6 right-6 z-20">
        <Button
          size="lg"
          onClick={handleOpenCreate}
          className="h-14 w-14 rounded-full shadow-lg text-2xl p-0"
          aria-label={t('add')}
        >
          +
        </Button>
      </div>

      {/* 거래 추가/수정 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleFormCancel() }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? t('edit') : t('add')}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            transaction={editingTransaction}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isMutating}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingId(null)}>
              {tc('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? tc('deleting') : tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
