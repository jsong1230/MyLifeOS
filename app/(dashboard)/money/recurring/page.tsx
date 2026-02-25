'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { RecurringSummary } from '@/components/money/recurring-summary'
import { RecurringItem } from '@/components/money/recurring-item'
import { RecurringForm } from '@/components/money/recurring-form'
import {
  useRecurring,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
} from '@/hooks/use-recurring'
import { PlusIcon } from 'lucide-react'
import type { RecurringExpense, CreateRecurringInput } from '@/types/recurring'

/**
 * 정기 지출 관리 페이지
 * - RecurringSummary: 월간 총액 요약
 * - RecurringItem 목록
 * - 추가/수정 Dialog + 삭제 AlertDialog
 */
export default function RecurringPage() {
  const t = useTranslations()
  // 폼 다이얼로그 상태
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<RecurringExpense | undefined>(undefined)

  // 삭제 확인 다이얼로그 상태
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 데이터 훅
  const { data: expenses = [], isLoading } = useRecurring()
  const createMutation = useCreateRecurring()
  const updateMutation = useUpdateRecurring()
  const deleteMutation = useDeleteRecurring()

  // 추가 버튼 클릭
  function handleAddClick() {
    setEditingExpense(undefined)
    setIsFormOpen(true)
  }

  // 수정 버튼 클릭
  function handleEditClick(expense: RecurringExpense) {
    setEditingExpense(expense)
    setIsFormOpen(true)
  }

  // 폼 다이얼로그 닫기
  function handleFormCancel() {
    setIsFormOpen(false)
    setEditingExpense(undefined)
  }

  // 폼 제출 (생성 or 수정)
  function handleFormSubmit(data: CreateRecurringInput) {
    if (editingExpense) {
      updateMutation.mutate(
        { id: editingExpense.id, input: data },
        {
          onSuccess: () => {
            setIsFormOpen(false)
            setEditingExpense(undefined)
          },
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false)
        },
      })
    }
  }

  // 삭제 요청
  function handleDeleteRequest(id: string) {
    setDeletingId(id)
  }

  // 삭제 확인
  function handleDeleteConfirm() {
    if (!deletingId) return
    deleteMutation.mutate(deletingId, {
      onSuccess: () => {
        setDeletingId(null)
      },
    })
  }

  // 삭제 취소
  function handleDeleteCancel() {
    setDeletingId(null)
  }

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      {/* 로딩 상태 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        </div>
      ) : (
        <>
          {/* 월간 총액 요약 */}
          <RecurringSummary expenses={expenses} />

          {/* 정기 지출 목록 */}
          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground text-sm">
                {t('money.recurring.noData')}
              </p>
              <p className="text-muted-foreground text-xs mt-1">
                {t('money.recurring.noDataHint')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((expense) => (
                <RecurringItem
                  key={expense.id}
                  expense={expense}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          )}

          {/* 정기 지출 추가 버튼 */}
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleAddClick}
          >
            <PlusIcon className="size-4" />
            {t('money.recurring.addButton')}
          </Button>
        </>
      )}

      {/* 추가/수정 다이얼로그 */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) handleFormCancel()
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? t('money.recurring.edit') : t('money.recurring.add')}
            </DialogTitle>
          </DialogHeader>
          <RecurringForm
            expense={editingExpense}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isMutating}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) handleDeleteCancel()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('money.recurring.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('money.recurring.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={deleteMutation.isPending}
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t('private.diary.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
