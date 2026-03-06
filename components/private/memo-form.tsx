'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Pin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCreateMemo, useUpdateMemo } from '@/hooks/use-memos'
import type { MemoColor, DecryptedMemo } from '@/types/memo'

// 색상별 Tailwind 클래스 매핑
const COLOR_BG: Record<MemoColor, string> = {
  default: 'bg-background border-border',
  yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
  green: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
  blue: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
  pink: 'bg-pink-50 border-pink-200 dark:bg-pink-950 dark:border-pink-800',
  purple: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
}

// 색상 선택 점 버튼 스타일
const COLOR_DOT: Record<MemoColor, string> = {
  default: 'bg-gray-200 dark:bg-gray-600',
  yellow: 'bg-yellow-300',
  green: 'bg-green-300',
  blue: 'bg-blue-300',
  pink: 'bg-pink-300',
  purple: 'bg-purple-300',
}

const MEMO_COLORS: MemoColor[] = ['default', 'yellow', 'green', 'blue', 'pink', 'purple']

interface MemoFormProps {
  /** 수정 시 기존 메모 (없으면 생성 모드) */
  editingMemo?: DecryptedMemo
  onSuccess?: () => void
  onCancel?: () => void
}

export function MemoForm({ editingMemo, onSuccess, onCancel }: MemoFormProps) {
  const t = useTranslations('private.memos')

  const [content, setContent] = useState(editingMemo?.content ?? '')
  const [color, setColor] = useState<MemoColor>(editingMemo?.color ?? 'default')
  const [isPinned, setIsPinned] = useState(editingMemo?.is_pinned ?? false)

  const createMemo = useCreateMemo()
  const updateMemo = useUpdateMemo()

  const isEditing = !!editingMemo
  const isPending = createMemo.isPending || updateMemo.isPending

  const handleSubmit = async () => {
    if (!content.trim()) return

    try {
      if (isEditing) {
        await updateMemo.mutateAsync({
          id: editingMemo.id,
          input: { content: content.trim(), color, is_pinned: isPinned },
        })
      } else {
        await createMemo.mutateAsync({
          content: content.trim(),
          color,
          is_pinned: isPinned,
        })
      }
      onSuccess?.()
    } catch {
      // 에러는 mutation 상태로 처리
    }
  }

  return (
    <div className={`rounded-lg border p-4 space-y-3 ${COLOR_BG[color]}`}>
      {/* 메모 내용 입력 */}
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('placeholder')}
        rows={4}
        className="resize-none bg-transparent border-0 p-0 focus-visible:ring-0 text-sm"
        autoFocus
      />

      {/* 하단 컨트롤 */}
      <div className="flex items-center justify-between gap-2">
        {/* 색상 선택 */}
        <div className="flex items-center gap-1" role="group" aria-label={t('color')}>
          {MEMO_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-5 h-5 rounded-full transition-transform ${COLOR_DOT[c]} ${
                color === c ? 'scale-125 ring-2 ring-offset-1 ring-foreground/30' : 'hover:scale-110'
              }`}
              aria-label={c}
              aria-pressed={color === c}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* 고정 토글 */}
          <button
            type="button"
            onClick={() => setIsPinned((prev) => !prev)}
            className={`p-1.5 rounded-md transition-colors ${
              isPinned
                ? 'text-orange-500 bg-orange-100 dark:bg-orange-900'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
            aria-label={isPinned ? t('unpin') : t('pin')}
            aria-pressed={isPinned}
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* 취소 버튼 */}
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
              {t('cancel')}
            </Button>
          )}

          {/* 저장 버튼 */}
          <Button
            size="sm"
            onClick={() => void handleSubmit()}
            disabled={isPending || !content.trim()}
          >
            {isPending ? t('saving') : t('save')}
          </Button>
        </div>
      </div>

      {/* 에러 메시지 */}
      {(createMemo.error ?? updateMemo.error) && (
        <p className="text-xs text-destructive">
          {(createMemo.error ?? updateMemo.error)?.message}
        </p>
      )}
    </div>
  )
}
