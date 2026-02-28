'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { BudgetList } from '@/components/money/budget-list'
import { BudgetForm } from '@/components/money/budget-form'
import { useBudgets, useUpsertBudget, useUpdateBudget, useDeleteBudget } from '@/hooks/use-budgets'
import type { Budget, CreateBudgetInput } from '@/types/budget'

/**
 * 현재 월을 YYYY-MM 형식으로 반환
 */
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

/**
 * 월별 예산 설정 페이지
 * - 예산 목록 조회 (BudgetList)
 * - 예산 추가/수정 Dialog (BudgetForm)
 * - 예산 삭제 확인 AlertDialog
 */
export default function BudgetPage() {
  const t = useTranslations()
  // 선택된 월 상태 (기본: 현재 월)
  const [month, setMonth] = useState<string>(getCurrentMonth)

  // 폼 다이얼로그 상태
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined)

  // 삭제 확인 다이얼로그 상태
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 데이터 훅
  const { data: budgets = [], isLoading } = useBudgets(month)
  const upsertMutation = useUpsertBudget()
  const updateMutation = useUpdateBudget()
  const deleteMutation = useDeleteBudget()

  // 예산 추가 버튼 클릭
  function handleAddClick() {
    setEditingBudget(undefined)
    setIsFormOpen(true)
  }

  // 예산 수정 버튼 클릭
  function handleEditClick(budget: Budget) {
    setEditingBudget(budget)
    setIsFormOpen(true)
  }

  // 폼 다이얼로그 닫기
  function handleFormCancel() {
    setIsFormOpen(false)
    setEditingBudget(undefined)
  }

  // 예산 저장 (생성 or 수정)
  function handleFormSubmit(data: CreateBudgetInput) {
    if (editingBudget) {
      // 수정 시: PATCH /api/budgets/[id] 사용
      updateMutation.mutate(
        { id: editingBudget.id, input: { amount: data.amount, currency: data.currency } },
        {
          onSuccess: () => {
            setIsFormOpen(false)
            setEditingBudget(undefined)
          },
        }
      )
    } else {
      // 추가 시: upsert 유지
      upsertMutation.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false)
          setEditingBudget(undefined)
        },
      })
    }
  }

  // 예산 삭제 요청
  function handleDeleteRequest(id: string) {
    setDeletingId(id)
  }

  // 예산 삭제 확인
  function handleDeleteConfirm() {
    if (!deletingId) return
    deleteMutation.mutate(deletingId, {
      onSuccess: () => {
        setDeletingId(null)
      },
    })
  }

  // 예산 삭제 취소
  function handleDeleteCancel() {
    setDeletingId(null)
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* 로딩 상태 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground text-sm">{t('common.loading')}</p>
        </div>
      ) : (
        <BudgetList
          budgets={budgets}
          month={month}
          onMonthChange={setMonth}
          onEdit={handleEditClick}
          onDelete={handleDeleteRequest}
          onAdd={handleAddClick}
        />
      )}

      {/* 예산 추가/수정 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleFormCancel() }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? t('money.budget.edit') : t('money.budget.add')}
            </DialogTitle>
          </DialogHeader>
          <BudgetForm
            budget={editingBudget}
            month={month}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={upsertMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* 예산 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={deletingId !== null}
        onOpenChange={(open) => { if (!open) handleDeleteCancel() }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('money.budget.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('money.budget.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={deleteMutation.isPending}>
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
