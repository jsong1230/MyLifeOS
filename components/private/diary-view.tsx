'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2 } from 'lucide-react'
import { EMOTION_LABELS, EMOTION_ICONS, type DiaryEntryDecrypted } from '@/types/diary'

interface DiaryViewProps {
  diary: DiaryEntryDecrypted
  onEdit: () => void
  onDelete: () => void
  isDeleting?: boolean
}

// 복호화된 일기 내용을 표시하는 컴포넌트
// - 감정 태그 배지 표시
// - 수정/삭제 버튼
export function DiaryView({ diary, onEdit, onDelete, isDeleting = false }: DiaryViewProps) {
  return (
    <div className="space-y-4">
      {/* 감정 태그 배지 */}
      <div className="flex flex-wrap gap-2">
        {diary.emotion_tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 text-sm">
            <span aria-hidden="true">{EMOTION_ICONS[tag]}</span>
            {EMOTION_LABELS[tag]}
          </Badge>
        ))}
      </div>

      {/* 일기 내용 */}
      <div
        className="text-sm leading-relaxed whitespace-pre-wrap min-h-[100px] text-foreground"
        aria-label="일기 내용"
      >
        {diary.content}
      </div>

      {/* 수정/삭제 버튼 */}
      <div className="flex gap-2 justify-end pt-2 border-t">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={isDeleting}
          className="gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          수정
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onDelete}
          disabled={isDeleting}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isDeleting ? '삭제 중...' : '삭제'}
        </Button>
      </div>
    </div>
  )
}
