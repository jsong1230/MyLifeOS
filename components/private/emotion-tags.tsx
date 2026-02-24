'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { EMOTION_ICONS, type EmotionType } from '@/types/diary'

interface EmotionTagsProps {
  selected: EmotionType[]
  onChange: (tags: EmotionType[]) => void
  disabled?: boolean
}

// 감정 타입 배열 (표시 순서 고정)
const EMOTION_LIST: EmotionType[] = [
  'happy', 'sad', 'angry', 'anxious', 'excited',
  'calm', 'tired', 'lonely', 'grateful', 'proud',
]

// 10개 감정 아이콘 버튼 그리드 컴포넌트
export function EmotionTags({ selected, onChange, disabled = false }: EmotionTagsProps) {
  const t = useTranslations('private.emotions')

  // 감정 태그 토글 처리
  function handleToggle(emotion: EmotionType) {
    if (disabled) return
    if (selected.includes(emotion)) {
      // 선택 해제 (최소 1개 유지를 위해 1개 남은 경우 해제 불가)
      if (selected.length <= 1) return
      onChange(selected.filter((e) => e !== emotion))
    } else {
      onChange([...selected, emotion])
    }
  }

  return (
    <div className="grid grid-cols-5 gap-2" role="group" aria-label={t('selectTagsLabel')}>
      {EMOTION_LIST.map((emotion) => {
        const isSelected = selected.includes(emotion)
        return (
          <button
            key={emotion}
            type="button"
            onClick={() => handleToggle(emotion)}
            disabled={disabled}
            aria-pressed={isSelected}
            aria-label={t(emotion as Parameters<typeof t>[0])}
            className={cn(
              'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isSelected
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="text-lg leading-none" aria-hidden="true">
              {EMOTION_ICONS[emotion]}
            </span>
            <span>{t(emotion as Parameters<typeof t>[0])}</span>
          </button>
        )
      })}
    </div>
  )
}
