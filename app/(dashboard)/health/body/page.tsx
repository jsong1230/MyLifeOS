'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
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
import { BodyLogForm } from '@/components/health/body-log-form'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

const BodyTrendChart = dynamic(
  () => import('@/components/health/body-trend-chart').then((m) => ({ default: m.BodyTrendChart })),
  { ssr: false, loading: () => <Skeleton className="h-48 rounded-xl" /> }
)
import {
  useBodyLogs,
  useCreateBodyLog,
  useUpdateBodyLog,
  useDeleteBodyLog,
} from '@/hooks/use-body-logs'
import type { BodyLog, CreateBodyLogInput } from '@/types/health'

// 체중/체성분 기록 행 컴포넌트
function BodyLogItem({
  log,
  onEdit,
  onDelete,
}: {
  log: BodyLog
  onEdit: (log: BodyLog) => void
  onDelete: (id: string) => void
}) {
  const t = useTranslations('health.body')
  const tc = useTranslations('common')
  const parts: string[] = []
  if (log.weight != null) parts.push(t('weightLabel', { weight: log.weight }))
  if (log.body_fat != null) parts.push(t('bodyFatLabel', { percent: log.body_fat }))
  if (log.muscle_mass != null) parts.push(t('muscleMassLabel', { mass: log.muscle_mass }))

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{log.date.replace(/-/g, '.')}</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {parts.join(' · ')}
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

// 체중/체성분 기록 페이지
export default function BodyPage() {
  const t = useTranslations('health.body')
  const tc = useTranslations('common')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLog, setEditingLog] = useState<BodyLog | undefined>(undefined)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const { data: logs = [], isLoading } = useBodyLogs(60)
  const createLog = useCreateBodyLog()
  const updateLog = useUpdateBodyLog()
  const deleteLog = useDeleteBodyLog()

  function handleOpenCreate() {
    setEditingLog(undefined)
    setIsFormOpen(true)
  }

  function handleOpenEdit(log: BodyLog) {
    setEditingLog(log)
    setIsFormOpen(true)
  }

  function handleFormCancel() {
    setIsFormOpen(false)
    setEditingLog(undefined)
  }

  function handleFormSubmit(data: CreateBodyLogInput) {
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

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <h1 className="text-sm font-semibold text-center">{t('title')}</h1>
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* 추이 차트 (2개 이상일 때만 표시) */}
          {logs.length >= 2 && <BodyTrendChart logs={logs} />}

          {/* 기록 목록 */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">{tc('loading')}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2">
              <p className="text-sm text-muted-foreground">{t('noData')}</p>
              <Button variant="outline" size="sm" onClick={handleOpenCreate}>
                {t('addFirst')}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <BodyLogItem
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
          <BodyLogForm
            log={editingLog}
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
