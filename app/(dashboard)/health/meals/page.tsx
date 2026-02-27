'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
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
import { MealList } from '@/components/health/meal-list'
import { MealForm } from '@/components/health/meal-form'
import { DietGoalProgress } from '@/components/health/diet-goal-progress'
import { useMeals, useCreateMeal, useUpdateMeal, useDeleteMeal } from '@/hooks/use-meals'
import { useDietGoal } from '@/hooks/use-diet-goal'
import type { MealLog, CreateMealInput } from '@/types/health'

// 날짜를 하루 단위로 이동하는 헬퍼
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

// 날짜를 로케일에 맞게 표시하는 헬퍼
function formatDisplayDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

// 오늘 날짜 여부 확인
function isToday(dateStr: string): boolean {
  return dateStr === new Date().toISOString().split('T')[0]
}

// 식사 기록 페이지
export default function MealsPage() {
  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations('health.meals')
  const tc = useTranslations('common')
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )

  // 다이얼로그 상태
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingMeal, setEditingMeal] = useState<MealLog | undefined>(undefined)

  // 삭제 확인 다이얼로그 상태
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // 데이터 훅
  const { data: meals = [], isLoading } = useMeals(selectedDate)
  const createMeal = useCreateMeal()
  const updateMeal = useUpdateMeal()
  const deleteMeal = useDeleteMeal()

  // 식단 목표 훅
  const { data: dietGoal } = useDietGoal()

  // 이전 날짜로 이동
  function handlePrevDay() {
    setSelectedDate((prev) => addDays(prev, -1))
  }

  // 다음 날짜로 이동
  function handleNextDay() {
    setSelectedDate((prev) => addDays(prev, 1))
  }

  // 추가 다이얼로그 열기
  function handleOpenCreate() {
    setEditingMeal(undefined)
    setIsFormOpen(true)
  }

  // 수정 다이얼로그 열기
  function handleOpenEdit(meal: MealLog) {
    setEditingMeal(meal)
    setIsFormOpen(true)
  }

  // 폼 다이얼로그 닫기
  function handleFormCancel() {
    setIsFormOpen(false)
    setEditingMeal(undefined)
  }

  // 식사 기록 생성 또는 수정 제출 처리
  function handleFormSubmit(data: CreateMealInput) {
    if (editingMeal) {
      // 수정 — 선택된 날짜를 기본값으로 사용
      updateMeal.mutate(
        { id: editingMeal.id, input: { ...data } },
        {
          onSuccess: () => {
            setIsFormOpen(false)
            setEditingMeal(undefined)
          },
        }
      )
    } else {
      // 생성 — 현재 선택된 날짜를 date로 전달
      createMeal.mutate(
        { ...data, date: data.date ?? selectedDate },
        {
          onSuccess: () => {
            setIsFormOpen(false)
          },
        }
      )
    }
  }

  // 삭제 확인 다이얼로그 열기
  function handleDeleteRequest(id: string) {
    setDeleteTargetId(id)
  }

  // 삭제 확정
  function handleDeleteConfirm() {
    if (!deleteTargetId) return
    deleteMeal.mutate(deleteTargetId, {
      onSuccess: () => {
        setDeleteTargetId(null)
      },
    })
  }

  // 삭제 취소
  function handleDeleteCancel() {
    setDeleteTargetId(null)
  }

  const isMutating =
    createMeal.isPending || updateMeal.isPending

  // FAB action=add 파라미터 감지 → 폼 자동 오픈
  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      handleOpenCreate()
    }
  }, [searchParams])

  return (
    <div className="flex flex-col h-full">
      {/* 날짜 선택 헤더 */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevDay}
            aria-label={t('prevDay')}
          >
            &lt;
          </Button>

          <div className="text-center">
            <p className="text-sm font-semibold">{formatDisplayDate(selectedDate, locale)}</p>
            {isToday(selectedDate) && (
              <p className="text-xs text-primary">{t('today')}</p>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextDay}
            aria-label={t('nextDay')}
          >
            &gt;
          </Button>
        </div>
      </div>

      {/* 식사 목록 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* 오늘 날짜이고 식단 목표가 설정된 경우 — 칼로리 목표 달성 프로그레스 표시 */}
          {isToday(selectedDate) && dietGoal && (
            <DietGoalProgress
              goal={dietGoal}
              consumed={{
                calories: meals.reduce((sum, meal) => sum + (meal.calories ?? 0), 0),
                protein: meals.reduce((sum, meal) => sum + (meal.protein ?? 0), 0),
                carbs: meals.reduce((sum, meal) => sum + (meal.carbs ?? 0), 0),
                fat: meals.reduce((sum, meal) => sum + (meal.fat ?? 0), 0),
              }}
            />
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">{tc('loading')}</p>
            </div>
          ) : (
            <MealList
              meals={meals}
              date={selectedDate}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteRequest}
            />
          )}
        </div>
      </div>

      {/* 하단 식사 추가 버튼 */}
      <div className="sticky bottom-0 bg-background border-t px-4 py-3">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full"
            onClick={handleOpenCreate}
            disabled={isLoading || isMutating}
          >
            {t('addButton')}
          </Button>
        </div>
      </div>

      {/* 식사 기록 추가/수정 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleFormCancel() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingMeal ? t('editTitle') : t('addTitle')}</DialogTitle>
          </DialogHeader>
          <MealForm
            meal={editingMeal}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isMutating}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) handleDeleteCancel() }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={deleteMeal.isPending}>
              {tc('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMeal.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMeal.isPending ? tc('deleting') : tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
