'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { EmotionTags } from './emotion-tags'
import type { EmotionType, DiaryEntryDecrypted } from '@/types/diary'

interface DiaryFormProps {
  // 수정 모드일 때 기존 일기 데이터
  diary?: DiaryEntryDecrypted
  // 작성 날짜 (읽기 전용 표시용)
  date: string
  onSubmit: (data: { content: string; emotion_tags: EmotionType[] }) => void
  onCancel?: () => void
  isLoading?: boolean
}

// 날짜를 한국어 형식으로 포맷 (YYYY-MM-DD → YYYY년 M월 D일)
function formatDateKr(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${year}년 ${month}월 ${day}일`
}

// 일기 작성/수정 폼 컴포넌트
// - 감정 태그 선택 그리드 (10개 버튼, 다중 선택 가능)
// - textarea로 일기 내용 작성
// - 날짜 표시 (읽기 전용)
// - 저장 시 암호화는 hooks/use-diaries.ts에서 처리
export function DiaryForm({ diary, date, onSubmit, onCancel, isLoading = false }: DiaryFormProps) {
  const t = useTranslations('private.diary')
  const tCommon = useTranslations('common')

  const [content, setContent] = useState(diary?.content ?? '')
  const [emotionTags, setEmotionTags] = useState<EmotionType[]>(
    diary?.emotion_tags ?? []
  )
  const [errors, setErrors] = useState<{ content?: string; emotion_tags?: string }>({})

  // 폼 검증
  function validate(): boolean {
    const newErrors: { content?: string; emotion_tags?: string } = {}

    if (!content.trim()) {
      newErrors.content = t('contentRequired')
    }

    if (emotionTags.length === 0) {
      newErrors.emotion_tags = t('emotionRequired')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    onSubmit({
      content: content.trim(),
      emotion_tags: emotionTags,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 날짜 표시 (읽기 전용) */}
      <div className="text-sm font-medium text-muted-foreground">
        {formatDateKr(date)}
      </div>

      {/* 감정 태그 선택 */}
      <div className="space-y-2">
        <Label>
          {t('todayEmotion')} <span className="text-destructive">*</span>
        </Label>
        <EmotionTags
          selected={emotionTags}
          onChange={setEmotionTags}
          disabled={isLoading}
        />
        {errors.emotion_tags && (
          <p className="text-xs text-destructive" role="alert">
            {errors.emotion_tags}
          </p>
        )}
      </div>

      {/* 일기 내용 입력 */}
      <div className="space-y-2">
        <Label htmlFor="diary-content">
          {t('contentLabel')} <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="diary-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('contentPlaceholder')}
          disabled={isLoading}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none min-h-[200px]"
          aria-label={t('contentLabel')}
        />
        {errors.content && (
          <p className="text-xs text-destructive" role="alert">
            {errors.content}
          </p>
        )}
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-2 justify-end pt-1">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {tCommon('cancel')}
          </Button>
        )}
        <Button type="submit" disabled={isLoading || emotionTags.length === 0}>
          {isLoading ? tCommon('saving') : diary ? tCommon('update') : tCommon('save')}
        </Button>
      </div>
    </form>
  )
}
