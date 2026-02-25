'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
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
import { ExerciseForm } from '@/components/health/exercise-form'
import {
  useExerciseLogs,
  useCreateExerciseLog,
  useUpdateExerciseLog,
  useDeleteExerciseLog,
  getCurrentWeekStart,
} from '@/hooks/use-exercise-logs'
import { EXERCISE_INTENSITY_LABEL } from '@/types/health'
import type { ExerciseLog, CreateExerciseInput } from '@/types/health'

// 주간 레이블: locale 기반 포맷
function formatWeekLabelLocale(weekStart: string, locale: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const fmt = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' })
  return `${fmt.format(start)} ~ ${fmt.format(end)}`
}

// 주간 날짜 범위 이동 헬퍼 (7일 단위)
function addWeeks(weekStart: string, n: number): string {
  const date = new Date(weekStart + 'T00:00:00')
  date.setDate(date.getDate() + n * 7)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 이번 주 여부 확인
function isCurrentWeek(weekStart: string): boolean {
  return weekStart === getCurrentWeekStart()
}

// 운동 기록 행 컴포넌트
function ExerciseLogItem({
  log,
  onEdit,
  onDelete,
}: {
  log: ExerciseLog
  onEdit: (log: ExerciseLog) => void
  onDelete: (id: string) => void
}) {
  const tc = useTranslations('common')
  const t = useTranslations('health.exercise')
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{log.exercise_type}</p>
              <span className="text-xs text-muted-foreground">{log.date.replace(/-/g, '.')}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {log.duration_min}{t('durationUnit')} · {t(`intensities.${log.intensity}` as Parameters<typeof t>[0])}
              {log.calories_burned != null && ` · ${log.calories_burned}kcal`}
            </p>
            {log.note && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{log.note}</p>
            )}
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => onEdit(log)}
            >
              {tc('edit')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-destructive hover:text-destructive"
              onClick={() => onDelete(log.id)}
            >
              {tc('delete')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 운동 기록 페이지
export default function ExercisePage() {
  const locale = useLocale()
  const t = useTranslations('health.exercise')
  const tc = useTranslations('common')
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<ExerciseLog | undefined>(undefined)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const { data: logs = [], isLoading } = useExerciseLogs(weekStart)
  const createLog = useCreateExerciseLog()
  const updateLog = useUpdateExerciseLog()
  const deleteLog = useDeleteExerciseLog()

  function handleOpenCreate() {
    setEditingLog(undefined)
    setIsFormOpen(true)
  }

  function handleOpenEdit(log: ExerciseLog) {
    setEditingLog(log)
    setIsFormOpen(true)
  }

  function handleFormCancel() {
    setIsFormOpen(false)
    setEditingLog(undefined)
  }

  function handleFormSubmit(data: CreateExerciseInput) {
    if (editingLog) {
      updateLog.mutate(
        { id: editingLog.id, input: data },
        { onSuccess: () => { setIsFormOpen(false); setEditingLog(undefined) } }
      )
    } else {
      createLog.mutate(data, { onSuccess: () => setIsFormOpen(false) })
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTargetId) return
    deleteLog.mutate(deleteTargetId, { onSuccess: () => setDeleteTargetId(null) })
  }

  const isMutating = createLog.isPending || updateLog.isPending

  // 주간 총 운동 시간 합산
  const totalMin = logs.reduce((sum, l) => sum + l.duration_min, 0)

  return (
    <div className="flex flex-col h-full">
      {/* 주간 네비게이션 헤더 */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart((w) => addWeeks(w, -1))}
            aria-label={tc('prevWeek')}
          >
            &lt;
          </Button>
          <div className="text-center">
            <p className="text-sm font-semibold">{formatWeekLabelLocale(weekStart, locale)}</p>
            {isCurrentWeek(weekStart) && (
              <p className="text-xs text-primary">{tc('thisWeek')}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWeekStart((w) => addWeeks(w, 1))}
            disabled={isCurrentWeek(weekStart)}
            aria-label={tc('nextWeek')}
          >
            &gt;
          </Button>
        </div>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* 주간 요약 */}
          {logs.length > 0 && (
            <div className="flex gap-4 text-center">
              <div className="flex-1 bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-bold">{logs.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('sessionCount')}</p>
              </div>
              <div className="flex-1 bg-muted/50 rounded-lg p-3">
                <p className="text-2xl font-bold">{totalMin}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t('totalDurationMin')}</p>
              </div>
            </div>
          )}

          {/* 운동 기록 목록 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">{tc('loading')}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2">
              <p className="text-sm text-muted-foreground">{t('noDataThisWeek')}</p>
              <Button variant="outline" size="sm" onClick={handleOpenCreate}>
                {t('addFirst')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <ExerciseLogItem
                  key={log.id}
                  log={log}
                  onEdit={handleOpenEdit}
                  onDelete={setDeleteTargetId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 하단 추가 버튼 */}
      <div className="sticky bottom-0 bg-background border-t px-4 py-3">
        <div className="max-w-lg mx-auto">
          <Button className="w-full" onClick={handleOpenCreate} disabled={isLoading || isMutating}>
            {t('addButton')}
          </Button>
        </div>
      </div>

      {/* 추가/수정 다이얼로그 */}
      <Dialog open={isFormOpen} onOpenChange={(open) => { if (!open) handleFormCancel() }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLog ? t('editTitle') : t('addTitle')}</DialogTitle>
          </DialogHeader>
          <ExerciseForm
            log={editingLog}
            defaultDate={weekStart}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isMutating}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => { if (!open) setDeleteTargetId(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTargetId(null)} disabled={deleteLog.isPending}>
              {tc('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLog.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLog.isPending ? tc('deleting') : tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
