'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
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
import { TimeBlockTimeline } from '@/components/time/time-block-timeline'
import { TimeBlockForm } from '@/components/time/time-block-form'
import {
  useTimeBlocks,
  useCreateTimeBlock,
  useUpdateTimeBlock,
  useDeleteTimeBlock,
} from '@/hooks/use-time-blocks'
import { useTodos } from '@/hooks/use-todos'
import { getToday, formatDateToString } from '@/lib/date-utils'
import type { TimeBlock, CreateTimeBlockInput, UpdateTimeBlockInput } from '@/types/time-block'

// 오늘 날짜를 YYYY-MM-DD 형식으로 반환
function getTodayString(): string {
  return getToday()
}

// 날짜 문자열을 로케일에 맞게 변환
function formatDateLocale(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
}

// 날짜 문자열에서 하루 이전/이후 날짜 계산
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T00:00:00')
  date.setDate(date.getDate() + days)
  return formatDateToString(date)
}

// 타임블록 페이지
export default function TimeBlocksPage() {
  const locale = useLocale()
  const t = useTranslations('time.blocks')
  const tc = useTranslations('common')
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString())

  // 다이얼로그 상태
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | undefined>(undefined)
  const [defaultStartTime, setDefaultStartTime] = useState<string>('09:00')
  const [deleteTargetBlock, setDeleteTargetBlock] = useState<TimeBlock | undefined>(undefined)

  // React Query 훅
  const { data: blocks = [], isLoading } = useTimeBlocks(selectedDate)
  const createBlock = useCreateTimeBlock()
  const updateBlock = useUpdateTimeBlock()
  const deleteBlock = useDeleteTimeBlock()

  // 오늘 할일 목록 (할일 연결용)
  const { data: todos = [] } = useTodos({ date: selectedDate })

  // 날짜 이동
  function handlePrevDay() {
    setSelectedDate((prev) => addDays(prev, -1))
  }

  function handleNextDay() {
    setSelectedDate((prev) => addDays(prev, 1))
  }

  function handleToday() {
    setSelectedDate(getTodayString())
  }

  // 신규 블록 추가 다이얼로그 열기
  function handleOpenCreate(startTime?: string) {
    setSelectedBlock(undefined)
    setDefaultStartTime(startTime ?? '09:00')
    setIsFormOpen(true)
  }

  // 수정 다이얼로그 열기
  function handleOpenEdit(block: TimeBlock) {
    setSelectedBlock(block)
    setIsFormOpen(true)
  }

  // 다이얼로그 닫기
  function handleCloseForm() {
    setIsFormOpen(false)
    setSelectedBlock(undefined)
  }

  // 폼 제출 — 생성 또는 수정
  function handleFormSubmit(data: CreateTimeBlockInput | UpdateTimeBlockInput) {
    if (selectedBlock) {
      // 수정 모드
      updateBlock.mutate(
        { id: selectedBlock.id, input: data as UpdateTimeBlockInput },
        { onSuccess: handleCloseForm }
      )
    } else {
      // 생성 모드: 날짜 기본값 적용
      const createData: CreateTimeBlockInput = {
        ...(data as CreateTimeBlockInput),
        date: (data as CreateTimeBlockInput).date ?? selectedDate,
      }
      createBlock.mutate(createData, { onSuccess: handleCloseForm })
    }
  }

  // 드래그 이동으로 시간 변경
  function handleMove(id: string, newStartTime: string, newEndTime: string) {
    updateBlock.mutate({
      id,
      input: { start_time: newStartTime, end_time: newEndTime },
    })
  }

  // 삭제 확인 다이얼로그
  function handleDeleteRequest(block: TimeBlock) {
    setDeleteTargetBlock(block)
  }

  function handleDeleteConfirm() {
    if (!deleteTargetBlock) return
    deleteBlock.mutate(
      { id: deleteTargetBlock.id, date: deleteTargetBlock.date },
      { onSuccess: () => setDeleteTargetBlock(undefined) }
    )
  }

  function handleDeleteCancel() {
    setDeleteTargetBlock(undefined)
  }

  const isFormLoading = createBlock.isPending || updateBlock.isPending
  const isToday = selectedDate === getTodayString()

  return (
    <div className="flex flex-col h-full">
      {/* 날짜 탐색 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrevDay}
            aria-label={tc('prev')}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium min-w-[180px] text-center">
              {formatDateLocale(selectedDate, locale)}
            </span>
            {!isToday && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleToday}
                className="text-xs h-7 px-2"
              >
                {t('today')}
              </Button>
            )}
          </div>

          <Button
            size="icon"
            variant="ghost"
            onClick={handleNextDay}
            aria-label={tc('next')}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <Button
          size="sm"
          onClick={() => handleOpenCreate()}
          aria-label={t('addTitle')}
        >
          <Plus className="size-4" />
          {tc('add')}
        </Button>
      </div>

      {/* 타임라인 영역 */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="text-muted-foreground text-sm">{tc('loading')}</span>
          </div>
        ) : (
          <>
            {blocks.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">
                {t('noBlocks')}
              </p>
            )}
            <TimeBlockTimeline
              blocks={blocks}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteRequest}
              onAddAtTime={handleOpenCreate}
              onMove={handleMove}
            />
          </>
        )}
      </div>

      {/* 시간 블록 추가/수정 다이얼로그 */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => { if (!open) handleCloseForm() }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedBlock ? t('editTitle') : t('addTitle')}
            </DialogTitle>
          </DialogHeader>
          <TimeBlockForm
            block={selectedBlock}
            defaultDate={selectedDate}
            todos={todos}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseForm}
            isLoading={isFormLoading}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 AlertDialog */}
      <AlertDialog
        open={Boolean(deleteTargetBlock)}
        onOpenChange={(open) => { if (!open) handleDeleteCancel() }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteConfirm', { title: deleteTargetBlock?.title ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
