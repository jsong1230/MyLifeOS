'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Pin, MoreVertical, Pencil, Trash2, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useDeleteMemo } from '@/hooks/use-memos'
import { MemoForm } from './memo-form'
import type { DecryptedMemo, MemoColor } from '@/types/memo'

// 색상별 카드 배경 클래스
const COLOR_BG: Record<MemoColor, string> = {
  default: 'bg-card border-border',
  yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
  green: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
  blue: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  pink: 'bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800',
  purple: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
}

interface MemoCardProps {
  memo: DecryptedMemo
}

export function MemoCard({ memo }: MemoCardProps) {
  const t = useTranslations('private.memos')
  const [showDetail, setShowDetail] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const deleteMemo = useDeleteMemo()

  const handleDelete = () => {
    if (confirm(t('deleteConfirm'))) {
      deleteMemo.mutate(memo.id)
    }
  }

  return (
    <>
      {/* 메모 카드 */}
      <div
        className={`relative rounded-lg border p-3 space-y-2 cursor-pointer hover:shadow-md transition-shadow ${COLOR_BG[memo.color]}`}
        onClick={() => setShowDetail(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setShowDetail(true)}
        aria-label={memo.content.slice(0, 50)}
      >
        {/* 상단: 고정 아이콘 + 더보기 메뉴 */}
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            {/* 고정 배지 */}
            {memo.is_pinned && (
              <div className="flex items-center gap-1 mb-1">
                <Pin className="w-3 h-3 text-orange-500" />
                <span className="text-xs text-orange-500">{t('pinned')}</span>
              </div>
            )}
          </div>

          {/* 더보기 메뉴 — 클릭이 카드 openDetail로 버블링되지 않도록 stopPropagation */}
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  <MoreVertical className="w-3.5 h-3.5" />
                  <span className="sr-only">{t('more')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setIsEditing(true)
                    setShowDetail(false)
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  {t('edit')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={handleDelete}
                  disabled={deleteMemo.isPending}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  {t('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 메모 내용 (최대 3줄 truncate) */}
        <p className="text-sm whitespace-pre-wrap line-clamp-3 break-words">
          {memo.content}
        </p>

        {/* 날짜 */}
        <p className="text-xs text-muted-foreground">
          {new Date(memo.updated_at).toLocaleDateString()}
        </p>
      </div>

      {/* 전체 내용 모달 */}
      <Dialog open={showDetail && !isEditing} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-medium">
              {memo.is_pinned && <Pin className="w-4 h-4 text-orange-500" />}
              {t('title')}
            </DialogTitle>
          </DialogHeader>
          <div className={`rounded-lg border p-4 ${COLOR_BG[memo.color]}`}>
            <p className="text-sm whitespace-pre-wrap break-words">{memo.content}</p>
          </div>
          <p className="text-xs text-muted-foreground text-right">
            {new Date(memo.updated_at).toLocaleString()}
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDetail(false)
                setIsEditing(true)
              }}
            >
              <Pencil className="w-3.5 h-3.5 mr-1" />
              {t('edit')}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowDetail(false)}>
              <X className="w-3.5 h-3.5 mr-1" />
              {t('close')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 수정 모달 */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">{t('edit')}</DialogTitle>
          </DialogHeader>
          <MemoForm
            editingMemo={memo}
            onSuccess={() => setIsEditing(false)}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
