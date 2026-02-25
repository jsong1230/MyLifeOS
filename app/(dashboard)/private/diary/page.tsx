'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, PenLine, Search, Loader2 } from 'lucide-react'
import { useTranslations, useLocale } from 'next-intl'
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
import { DiaryForm } from '@/components/private/diary-form'
import { DiaryView } from '@/components/private/diary-view'
import { useDiary, useCreateDiary, useUpdateDiary, useDeleteDiary } from '@/hooks/use-diaries'
import type { EmotionType } from '@/types/diary'

// 날짜를 locale 기반으로 포맷 (YYYY-MM-DD → 로케일 날짜 문자열)
function formatDate(dateStr: string, locale: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

// 날짜를 N일 앞/뒤로 이동
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

// 오늘 날짜 (YYYY-MM-DD)
function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

// 일기 페이지 — 날짜 탐색 + 일기 표시/작성
export default function DiaryPage() {
  const router = useRouter()
  const t = useTranslations()
  const locale = useLocale()
  const today = getTodayStr()
  const [currentDate, setCurrentDate] = useState(today)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data: diary, isLoading, error } = useDiary(currentDate)
  const createMutation = useCreateDiary()
  const updateMutation = useUpdateDiary()
  const deleteMutation = useDeleteDiary()
  const [isResetting, setIsResetting] = useState(false)

  // 복호화 실패한 날짜의 일기를 삭제 (손상된 암호화 데이터 초기화)
  async function handleResetEncrypted() {
    if (!confirm(t('private.diary.dateDeleteConfirm'))) return
    setIsResetting(true)
    try {
      await fetch(`/api/diaries?date=${currentDate}`, { method: 'DELETE' })
      window.location.reload()
    } finally {
      setIsResetting(false)
    }
  }

  // 날짜 이전/다음 이동
  function goToPrevDay() {
    setCurrentDate((prev) => shiftDate(prev, -1))
  }

  function goToNextDay() {
    const next = shiftDate(currentDate, 1)
    // 미래 날짜 방지
    if (next <= today) setCurrentDate(next)
  }

  // 일기 작성 다이얼로그 열기
  function openCreateDialog() {
    setIsEditing(false)
    setDialogOpen(true)
  }

  // 일기 수정 다이얼로그 열기
  function openEditDialog() {
    setIsEditing(true)
    setDialogOpen(true)
  }

  // 일기 저장 처리 (생성 또는 수정)
  async function handleSubmit(data: { content: string; emotion_tags: EmotionType[] }) {
    try {
      if (isEditing && diary) {
        await updateMutation.mutateAsync({
          id: diary.id,
          input: { content: data.content, emotion_tags: data.emotion_tags },
        })
      } else {
        await createMutation.mutateAsync({
          content: data.content,
          emotion_tags: data.emotion_tags,
          date: currentDate,
        })
      }
      setDialogOpen(false)
    } catch {
      // 에러는 mutation 상태에서 처리
    }
  }

  // 일기 삭제 처리
  async function handleDelete() {
    if (!diary) return
    try {
      await deleteMutation.mutateAsync(diary.id)
      setDeleteDialogOpen(false)
    } catch {
      // 에러는 mutation 상태에서 처리
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending
  const mutationError = createMutation.error ?? updateMutation.error

  const isNextDisabled = shiftDate(currentDate, 1) > today

  return (
    <div className="flex flex-col h-full">
      {/* 날짜 탐색 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={goToPrevDay}
          aria-label={t('common.prev')}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <span className="text-sm font-medium">{formatDate(currentDate, locale)}</span>

        {/* 우측: 다음 날짜 버튼 + 검색 버튼 */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/private/diary/search')}
            aria-label={t('private.diary.search')}
          >
            <Search className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextDay}
            disabled={isNextDisabled}
            aria-label={t('common.next')}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* 일기 콘텐츠 영역 */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading && (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center min-h-[200px] gap-3 text-center px-4">
            <p className="text-sm text-destructive" role="alert">
              {error.message}
            </p>
            {error.message.includes('복호화') && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t('private.diary.decryptionHint')}<br />
                  {t('private.diary.decryptionHint2')}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleResetEncrypted}
                  disabled={isResetting}
                >
                  {isResetting ? t('private.diary.deleting') : t('private.diary.deleteByDate')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* 일기 없음 + 작성 버튼 */}
        {!isLoading && !error && !diary && (
          <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center">
            <p className="text-muted-foreground text-sm">{t('private.diary.noData')}</p>
            <Button onClick={openCreateDialog} className="gap-2">
              <PenLine className="h-4 w-4" />
              {t('private.diary.writeEntry')}
            </Button>
          </div>
        )}

        {/* 일기 표시 */}
        {!isLoading && !error && diary && (
          <DiaryView
            diary={diary}
            onEdit={openEditDialog}
            onDelete={() => setDeleteDialogOpen(true)}
            isDeleting={deleteMutation.isPending}
          />
        )}

        {/* 삭제 에러 표시 */}
        {deleteMutation.error && (
          <p className="text-xs text-destructive mt-2" role="alert">
            {deleteMutation.error.message}
          </p>
        )}
      </div>

      {/* 일기 작성/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !isMutating && setDialogOpen(open)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? t('private.diary.edit') : t('private.diary.add')}</DialogTitle>
          </DialogHeader>

          {/* mutation 에러 표시 */}
          {mutationError && (
            <p className="text-sm text-destructive" role="alert">
              {mutationError.message}
            </p>
          )}

          <DiaryForm
            diary={isEditing ? diary ?? undefined : undefined}
            date={currentDate}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            isLoading={isMutating}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('private.diary.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('private.diary.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
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
