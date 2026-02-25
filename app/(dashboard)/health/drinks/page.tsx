'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { DrinkSummary } from '@/components/health/drink-summary'
import { DrinkItem } from '@/components/health/drink-item'
import { DrinkForm } from '@/components/health/drink-form'
import {
  useDrinks,
  useCreateDrink,
  useUpdateDrink,
  useDeleteDrink,
} from '@/hooks/use-drinks'
import type { DrinkLog, CreateDrinkInput, UpdateDrinkInput } from '@/types/health'

// 로컬 날짜를 YYYY-MM-DD 문자열로 변환 (UTC 변환 없이 로컬 기준)
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 날짜 문자열(YYYY-MM-DD)의 해당 주 월요일 반환 (로컬 타임존 기준)
function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay() // 0=일, 1=월, ..., 6=토
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(date)
  monday.setDate(date.getDate() + diff)
  return toLocalDateStr(monday)
}

// 주 시작일로부터 7일 더하거나 빼기 (로컬 타임존 기준)
function shiftWeek(weekStart: string, direction: 1 | -1): string {
  const date = new Date(weekStart + 'T00:00:00')
  date.setDate(date.getDate() + direction * 7)
  return toLocalDateStr(date)
}

// 'YYYY-MM-DD' → 'M/D' 포맷
function formatShortDate(dateStr: string): string {
  const [, month, day] = dateStr.split('-')
  return `${parseInt(month)}/${parseInt(day)}`
}

// 주 레이블: 'M/D ~ M/D'
function buildWeekLabel(weekStart: string): string {
  const startDate = new Date(weekStart + 'T00:00:00')
  const endDate = new Date(weekStart + 'T00:00:00')
  endDate.setDate(startDate.getDate() + 6)

  const endStr = toLocalDateStr(endDate)
  return `${formatShortDate(weekStart)} ~ ${formatShortDate(endStr)}`
}

// 이번 주 여부 판단
function isCurrentWeek(weekStart: string): boolean {
  const today = toLocalDateStr(new Date())
  return weekStart === getWeekStart(today)
}

// 음주 기록 페이지 — 주간 탐색 + 요약 + 목록 + CRUD
export default function DrinksPage() {
  const t = useTranslations()

  // 현재 조회 중인 주의 시작일 (월요일)
  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
    return getWeekStart(toLocalDateStr(new Date()))
  })

  // 다이얼로그 상태
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<DrinkLog | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DrinkLog | null>(null)

  // 데이터 조회
  const { data: drinksData, isLoading, error } = useDrinks(currentWeekStart)

  // 뮤테이션 훅
  const createMutation = useCreateDrink()
  const updateMutation = useUpdateDrink()
  const deleteMutation = useDeleteDrink()

  const logs = drinksData?.data ?? []
  const weekLabel = buildWeekLabel(currentWeekStart)
  const isCurrent = isCurrentWeek(currentWeekStart)

  // 이전 주 이동
  function goToPrevWeek() {
    setCurrentWeekStart((prev) => shiftWeek(prev, -1))
  }

  // 다음 주 이동 (미래 주 이동 제한 없음)
  function goToNextWeek() {
    setCurrentWeekStart((prev) => shiftWeek(prev, 1))
  }

  // 이번 주로 돌아오기
  function goToCurrentWeek() {
    setCurrentWeekStart(getWeekStart(toLocalDateStr(new Date())))
  }

  // 추가 버튼 클릭
  function handleAddClick() {
    setEditTarget(null)
    setIsFormOpen(true)
  }

  // 수정 버튼 클릭
  function handleEditClick(drink: DrinkLog) {
    setEditTarget(drink)
    setIsFormOpen(true)
  }

  // 삭제 버튼 클릭
  function handleDeleteClick(drink: DrinkLog) {
    setDeleteTarget(drink)
  }

  // 폼 제출 처리 (생성 또는 수정)
  function handleFormSubmit(data: CreateDrinkInput) {
    if (editTarget) {
      // 수정
      const updateData: UpdateDrinkInput = {
        drink_type: data.drink_type,
        alcohol_pct: data.alcohol_pct ?? null,
        amount_ml: data.amount_ml,
        drink_count: data.drink_count ?? null,
        date: data.date,
        note: data.note ?? null,
      }
      updateMutation.mutate(
        { id: editTarget.id, input: updateData },
        {
          onSuccess: () => {
            setIsFormOpen(false)
            setEditTarget(null)
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

  // 삭제 확인 처리
  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
      },
    })
  }

  // 폼 다이얼로그 닫기
  function handleFormClose() {
    setIsFormOpen(false)
    setEditTarget(null)
  }

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* 주간 탐색 헤더 */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevWeek}
          aria-label={t('common.prevWeek')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="text-center">
          <button
            onClick={isCurrent ? undefined : goToCurrentWeek}
            className={
              isCurrent
                ? 'text-sm font-medium text-foreground cursor-default'
                : 'text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'
            }
          >
            {weekLabel}
          </button>
          {!isCurrent && (
            <p className="text-xs text-primary cursor-pointer mt-0.5" onClick={goToCurrentWeek}>
              {t('common.goToCurrentWeek')}
            </p>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={goToNextWeek}
          aria-label={t('common.nextWeek')}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* 주간 요약 카드 */}
      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            {t('common.loading')}
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center text-destructive text-sm">
            {t('common.loadFailed')}
          </CardContent>
        </Card>
      ) : (
        <DrinkSummary logs={logs} weekLabel={weekLabel} />
      )}

      {/* 음주 기록 목록 */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          {t('health.drinks.recordsTitle')}
        </h2>
        <Button
          size="sm"
          onClick={handleAddClick}
          disabled={isMutating}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          {t('common.add')}
        </Button>
      </div>

      {!isLoading && logs.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            {logs.map((drink, idx) => (
              <div key={drink.id}>
                <div className="px-4">
                  <DrinkItem
                    drink={drink}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                  />
                </div>
                {idx < logs.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : !isLoading ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t('health.drinks.noDrinksThisWeek')}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleAddClick}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t('health.drinks.addFirst')}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* 생성/수정 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleFormClose() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editTarget ? t('health.drinks.edit') : t('health.drinks.add')}
            </DialogTitle>
          </DialogHeader>
          <DrinkForm
            drink={editTarget ?? undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormClose}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('health.drinks.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('health.drinks.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
