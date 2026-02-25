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
import { SleepSummary } from '@/components/health/sleep-summary'
import { SleepItem } from '@/components/health/sleep-item'
import { SleepForm } from '@/components/health/sleep-form'
import { useSleep, useCreateSleep, useUpdateSleep, useDeleteSleep } from '@/hooks/use-sleep'
import type { SleepLog, CreateSleepInput } from '@/types/health'

// 로컬 날짜를 YYYY-MM-DD 문자열로 변환 (UTC 변환 없이 로컬 기준)
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 주 시작일(월요일)을 이전/다음 주로 이동하는 헬퍼
function addWeeks(weekStartStr: string, weeks: number): string {
  const date = new Date(weekStartStr + 'T00:00:00')
  date.setDate(date.getDate() + weeks * 7)
  return toLocalDateStr(date)
}

// 이번 주 월요일 계산 (로컬 타임존 기준)
function getCurrentWeekStart(): string {
  const today = new Date()
  const day = today.getDay() // 0=일, 1=월, ...
  const diff = day === 0 ? -6 : 1 - day
  today.setDate(today.getDate() + diff)
  return toLocalDateStr(today)
}

// 주간 레이블 포맷 (예: "2/23 ~ 3/1")
function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(weekStart + 'T00:00:00')
  end.setDate(end.getDate() + 6)

  const startLabel = `${start.getMonth() + 1}/${start.getDate()}`
  const endLabel = `${end.getMonth() + 1}/${end.getDate()}`
  return `${startLabel} ~ ${endLabel}`
}

// 이번 주 여부 확인
function isCurrentWeek(weekStart: string): boolean {
  return weekStart === getCurrentWeekStart()
}

// 수면 페이지 — 주간 수면 기록 관리
export default function SleepPage() {
  const t = useTranslations()
  const [weekStart, setWeekStart] = useState<string>(getCurrentWeekStart())

  // 다이얼로그 상태
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSleep, setEditingSleep] = useState<SleepLog | undefined>(undefined)

  // 삭제 확인 다이얼로그 상태
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  // 데이터 훅
  const { data, isLoading } = useSleep(weekStart)
  const logs = data?.data ?? []
  const summary = data?.summary

  const createSleep = useCreateSleep()
  const updateSleep = useUpdateSleep()
  const deleteSleep = useDeleteSleep()

  // 이전 주로 이동
  function handlePrevWeek() {
    setWeekStart((prev) => addWeeks(prev, -1))
  }

  // 다음 주로 이동
  function handleNextWeek() {
    setWeekStart((prev) => addWeeks(prev, 1))
  }

  // 이번 주로 돌아가기
  function handleGoToCurrentWeek() {
    setWeekStart(getCurrentWeekStart())
  }

  // 추가 다이얼로그 열기
  function handleOpenCreate() {
    setEditingSleep(undefined)
    setIsFormOpen(true)
  }

  // 수정 다이얼로그 열기
  function handleOpenEdit(sleep: SleepLog) {
    setEditingSleep(sleep)
    setIsFormOpen(true)
  }

  // 폼 다이얼로그 닫기
  function handleFormCancel() {
    setIsFormOpen(false)
    setEditingSleep(undefined)
  }

  // 수면 기록 생성 또는 수정 제출 처리
  function handleFormSubmit(data: CreateSleepInput) {
    if (editingSleep) {
      // 수정
      updateSleep.mutate(
        { id: editingSleep.id, input: data },
        {
          onSuccess: () => {
            setIsFormOpen(false)
            setEditingSleep(undefined)
          },
        }
      )
    } else {
      // 생성
      createSleep.mutate(data, {
        onSuccess: () => {
          setIsFormOpen(false)
        },
      })
    }
  }

  // 삭제 확인 다이얼로그 열기
  function handleDeleteRequest(id: string) {
    setDeleteTargetId(id)
  }

  // 삭제 확정
  function handleDeleteConfirm() {
    if (!deleteTargetId) return
    deleteSleep.mutate(deleteTargetId, {
      onSuccess: () => {
        setDeleteTargetId(null)
      },
    })
  }

  // 삭제 취소
  function handleDeleteCancel() {
    setDeleteTargetId(null)
  }

  const isMutating = createSleep.isPending || updateSleep.isPending
  const weekLabel = formatWeekLabel(weekStart)

  return (
    <div className="flex flex-col h-full">
      {/* 주간 탐색 헤더 */}
      <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevWeek}
            aria-label={t('common.prevWeek')}
          >
            &lt;
          </Button>

          <div className="text-center">
            <p className="text-sm font-semibold">{weekLabel}</p>
            {!isCurrentWeek(weekStart) && (
              <button
                type="button"
                onClick={handleGoToCurrentWeek}
                className="text-xs text-primary hover:underline"
              >
                {t('common.goToCurrentWeek')}
              </button>
            )}
            {isCurrentWeek(weekStart) && (
              <p className="text-xs text-primary">{t('common.thisWeek')}</p>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextWeek}
            aria-label={t('common.nextWeek')}
          >
            &gt;
          </Button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-lg mx-auto space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            </div>
          ) : (
            <>
              {/* 주간 수면 요약 차트 */}
              <SleepSummary
                logs={logs}
                weekLabel={
                  summary
                    ? t('health.sleep.weekAvgLabel', { week: weekLabel, hours: summary.avg_hours })
                    : weekLabel
                }
              />

              {/* 수면 기록 목록 */}
              <div className="space-y-2">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    <p>{t('health.sleep.noSleepThisWeek')}</p>
                    <p className="mt-1">{t('health.sleep.addHint')}</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <SleepItem
                      key={log.id}
                      sleep={log}
                      onEdit={handleOpenEdit}
                      onDelete={handleDeleteRequest}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 하단 수면 추가 버튼 */}
      <div className="sticky bottom-0 bg-background border-t px-4 py-3">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full"
            onClick={handleOpenCreate}
            disabled={isLoading || isMutating}
          >
            + {t('health.sleep.add')}
          </Button>
        </div>
      </div>

      {/* 수면 기록 추가/수정 다이얼로그 */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) handleFormCancel()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSleep ? t('health.sleep.edit') : t('health.sleep.add')}
            </DialogTitle>
          </DialogHeader>
          <SleepForm
            sleep={editingSleep}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isMutating}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) handleDeleteCancel()
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('health.sleep.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('health.sleep.deleteConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={deleteSleep.isPending}
            >
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteSleep.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSleep.isPending ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
