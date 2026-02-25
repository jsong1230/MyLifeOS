'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { RoutineList } from '@/components/time/routine-list'
import { RoutineForm } from '@/components/time/routine-form'
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
import {
  useRoutines,
  useCreateRoutine,
  useUpdateRoutine,
  useDeleteRoutine,
  useToggleRoutine,
} from '@/hooks/use-routines'
import { Plus } from 'lucide-react'
import type { Routine, CreateRoutineInput, UpdateRoutineInput } from '@/types/routine'

/**
 * 오늘 날짜를 로케일 기반으로 포맷
 */
function formatTodayLabel(locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date())
}

/**
 * 오늘 날짜 YYYY-MM-DD 반환
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * 루틴 관리 페이지 (오늘의 루틴 체크인)
 */
export default function RoutinesPage() {
  const locale = useLocale()
  const t = useTranslations('time.routines')
  const tc = useTranslations('common')
  // 수정 중인 루틴
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null)
  // 추가 다이얼로그 열림 여부
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  // 삭제 확인 대상 루틴 ID
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const today = getTodayString()

  // React Query 훅
  const { data: routines, isLoading, error } = useRoutines()
  const createMutation = useCreateRoutine()
  const updateMutation = useUpdateRoutine()
  const deleteMutation = useDeleteRoutine()
  const toggleMutation = useToggleRoutine()

  // 루틴 체크인 토글
  function handleToggle(routineId: string, date: string, completed: boolean) {
    toggleMutation.mutate({ routineId, date, completed })
  }

  // 수정 다이얼로그 열기
  function handleEdit(routine: Routine) {
    setEditingRoutine(routine)
  }

  // 수정 다이얼로그 닫기
  function handleEditCancel() {
    setEditingRoutine(null)
  }

  // 루틴 수정 제출
  function handleEditSubmit(data: CreateRoutineInput | UpdateRoutineInput) {
    if (!editingRoutine) return

    updateMutation.mutate(
      { id: editingRoutine.id, input: data as UpdateRoutineInput },
      {
        onSuccess: () => {
          setEditingRoutine(null)
        },
      }
    )
  }

  // 삭제 확인 다이얼로그 열기
  function handleDeleteRequest(id: string) {
    setDeletingId(id)
  }

  // 삭제 실행
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

  // 활성 상태 토글 (일시정지/재개)
  function handleToggleActive(id: string, isActive: boolean) {
    updateMutation.mutate({ id, input: { is_active: isActive } })
  }

  // 루틴 추가 제출
  function handleAddSubmit(data: CreateRoutineInput | UpdateRoutineInput) {
    createMutation.mutate(data as CreateRoutineInput, {
      onSuccess: () => {
        setIsAddDialogOpen(false)
      },
    })
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-semibold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{formatTodayLabel(locale)}</p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
          aria-label={t('add')}
        >
          <Plus className="size-4" />
          {t('add')}
        </Button>
      </div>

      {/* 오류 상태 */}
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive mb-4"
        >
          {t('loadError')}
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg border bg-muted/30 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <RoutineList
          routines={routines ?? []}
          onToggle={handleToggle}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          onToggleActive={handleToggleActive}
        />
      )}

      {/* 루틴 추가 다이얼로그 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('add')}</DialogTitle>
          </DialogHeader>
          <RoutineForm
            onSubmit={handleAddSubmit}
            onCancel={() => setIsAddDialogOpen(false)}
            isLoading={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* 루틴 수정 다이얼로그 */}
      <Dialog
        open={Boolean(editingRoutine)}
        onOpenChange={(open) => !open && handleEditCancel()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('edit')}</DialogTitle>
          </DialogHeader>
          {editingRoutine && (
            <RoutineForm
              routine={editingRoutine}
              onSubmit={handleEditSubmit}
              onCancel={handleEditCancel}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog
        open={Boolean(deletingId)}
        onOpenChange={(open) => !open && handleDeleteCancel()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              {tc('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? tc('deleting') : tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
