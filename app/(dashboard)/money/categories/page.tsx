'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { CategoryList } from '@/components/money/category-list'
import { CategoryForm } from '@/components/money/category-form'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories'
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category'

// 카테고리 관리 페이지
// 카테고리 목록 + 추가/수정/삭제 기능 제공
export default function CategoriesPage() {
  const t = useTranslations('money.categories')
  const tc = useTranslations('common')

  // 카테고리 데이터 조회 (전체)
  const { data: categories, isLoading, error } = useCategories()

  // 뮤테이션 훅
  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const deleteCategory = useDeleteCategory()

  // Dialog 상태 관리
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | undefined>(undefined)

  // 삭제 확인 AlertDialog 상태
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null)

  // 카테고리 추가 다이얼로그 열기
  function handleOpenCreate() {
    setEditingCategory(undefined)
    setIsFormDialogOpen(true)
  }

  // 카테고리 수정 다이얼로그 열기
  function handleOpenEdit(category: Category) {
    setEditingCategory(category)
    setIsFormDialogOpen(true)
  }

  // 카테고리 삭제 확인 다이얼로그 열기
  function handleOpenDelete(id: string) {
    setDeleteErrorMessage(null)
    setDeletingCategoryId(id)
  }

  // 폼 제출 처리 (생성/수정 분기)
  function handleFormSubmit(data: CreateCategoryInput | UpdateCategoryInput) {
    if (editingCategory) {
      // 수정 모드
      updateCategory.mutate(
        { id: editingCategory.id, input: data as UpdateCategoryInput },
        {
          onSuccess: () => {
            setIsFormDialogOpen(false)
            setEditingCategory(undefined)
          },
        }
      )
    } else {
      // 생성 모드
      createCategory.mutate(data as CreateCategoryInput, {
        onSuccess: () => {
          setIsFormDialogOpen(false)
        },
      })
    }
  }

  // 삭제 확정 처리
  function handleConfirmDelete() {
    if (!deletingCategoryId) return

    deleteCategory.mutate(deletingCategoryId, {
      onSuccess: () => {
        setDeletingCategoryId(null)
        setDeleteErrorMessage(null)
      },
      onError: (error) => {
        // 409 (사용 중) 등 에러 메시지 표시
        setDeleteErrorMessage(error.message)
      },
    })
  }

  // 삭제 다이얼로그 닫기
  function handleCloseDelete() {
    setDeletingCategoryId(null)
    setDeleteErrorMessage(null)
  }

  // 폼 다이얼로그 닫기
  function handleCloseForm() {
    setIsFormDialogOpen(false)
    setEditingCategory(undefined)
  }

  // 뮤테이션 로딩 상태
  const isFormLoading = createCategory.isPending || updateCategory.isPending

  // 삭제 대상 카테고리 이름 조회
  const deletingCategory = categories?.find((c) => c.id === deletingCategoryId)

  return (
    <div className="p-4 sm:p-6">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('manageTitle')}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t('manageDescription')}
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          {t('add')}
        </Button>
      </div>

      {/* 카테고리 목록 카드 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t('listTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* 로딩 상태 */}
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-10 animate-pulse rounded-lg bg-muted"
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="py-4 text-center text-sm text-destructive">
              {t('loadError')}
            </div>
          )}

          {/* 카테고리 목록 */}
          {!isLoading && !error && categories && (
            <CategoryList
              categories={categories}
              onEdit={handleOpenEdit}
              onDelete={handleOpenDelete}
            />
          )}
        </CardContent>
      </Card>

      {/* 카테고리 생성/수정 다이얼로그 */}
      <Dialog open={isFormDialogOpen} onOpenChange={(open) => !open && handleCloseForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory
                ? editingCategory.is_system
                  ? t('systemCategoryLabel', { name: editingCategory.name })
                  : t('edit')
                : t('add')}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            category={editingCategory}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
            isLoading={isFormLoading}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog
        open={!!deletingCategoryId}
        onOpenChange={(open) => !open && handleCloseDelete()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteErrorMessage ? (
                <span className="text-destructive">{deleteErrorMessage}</span>
              ) : (
                t('deleteConfirm', { name: deletingCategory?.name ?? '' })
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDelete}>{tc('cancel')}</AlertDialogCancel>
            {!deleteErrorMessage && (
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteCategory.isPending}
              >
                {deleteCategory.isPending ? tc('deleting') : tc('delete')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
