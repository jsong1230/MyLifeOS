'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { decrypt } from '@/lib/crypto/encryption'
import { useDiarySearch } from '@/hooks/use-diary-search'
import {
  EMOTION_ICONS,
  type EmotionType,
} from '@/types/diary'

// 검색 결과 아이템 타입 (복호화 후)
interface SearchResultItem {
  id: string
  date: string
  content: string
  emotion_tags: EmotionType[]
  // 매칭된 본문 발췌 (앞뒤 50자 + 하이라이트 정보)
  excerpt: string
  // 하이라이트 적용을 위한 세그먼트
  segments: Array<{ text: string; highlight: boolean }>
}

// 키워드를 기준으로 앞뒤 50자 발췌 + 하이라이트 세그먼트 생성
function buildExcerptSegments(
  content: string,
  keyword: string
): Array<{ text: string; highlight: boolean }> {
  const lowerContent = content.toLowerCase()
  const lowerKeyword = keyword.toLowerCase()
  const matchIndex = lowerContent.indexOf(lowerKeyword)

  if (matchIndex === -1) {
    // 매칭 없는 경우 (감정 필터만으로 걸린 경우)
    const excerpt = content.slice(0, 100) + (content.length > 100 ? '...' : '')
    return [{ text: excerpt, highlight: false }]
  }

  // 앞뒤 50자 발췌
  const start = Math.max(0, matchIndex - 50)
  const end = Math.min(content.length, matchIndex + keyword.length + 50)
  const prefix = start > 0 ? '...' : ''
  const suffix = end < content.length ? '...' : ''

  const excerptContent = content.slice(start, end)
  const excerptLower = excerptContent.toLowerCase()
  const relativeMatchIndex = excerptLower.indexOf(lowerKeyword)

  if (relativeMatchIndex === -1) {
    return [{ text: prefix + excerptContent + suffix, highlight: false }]
  }

  const before = excerptContent.slice(0, relativeMatchIndex)
  const matched = excerptContent.slice(relativeMatchIndex, relativeMatchIndex + keyword.length)
  const after = excerptContent.slice(relativeMatchIndex + keyword.length)

  const segments: Array<{ text: string; highlight: boolean }> = []
  if (prefix + before) segments.push({ text: prefix + before, highlight: false })
  if (matched) segments.push({ text: matched, highlight: true })
  if (after + suffix) segments.push({ text: after + suffix, highlight: false })

  return segments
}

// 감정 태그 필터 버튼 컴포넌트
interface EmotionFilterButtonProps {
  emotionType: EmotionType
  selected: boolean
  onToggle: (emotion: EmotionType) => void
}

function EmotionFilterButton({ emotionType, selected, onToggle }: EmotionFilterButtonProps) {
  const te = useTranslations('private.emotions')
  return (
    <button
      type="button"
      onClick={() => onToggle(emotionType)}
      className={[
        'flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-colors',
        selected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background text-foreground border-border hover:bg-muted',
      ].join(' ')}
      aria-pressed={selected}
      aria-label={te(emotionType as Parameters<typeof te>[0])}
    >
      <span aria-hidden="true">{EMOTION_ICONS[emotionType]}</span>
      {te(emotionType as Parameters<typeof te>[0])}
    </button>
  )
}

// 검색 결과 아이템 컴포넌트
interface SearchResultCardProps {
  item: SearchResultItem
  onClick: (date: string) => void
}

function SearchResultCard({ item, onClick }: SearchResultCardProps) {
  const tCalendar = useTranslations('time.calendar')
  const te = useTranslations('private.emotions')

  function formatDateKr(dateStr: string): string {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(dateStr + 'T00:00:00')
    const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
    const dayKey = dayKeys[date.getDay()]
    return `${year}년 ${month}월 ${day}일 (${tCalendar(`weekdays.${dayKey}`)})`
  }

  return (
    <button
      type="button"
      onClick={() => onClick(item.date)}
      className="w-full text-left rounded-lg border bg-card p-4 hover:bg-accent transition-colors space-y-2"
      aria-label={`${formatDateKr(item.date)} 일기 보기`}
    >
      {/* 날짜 */}
      <p className="text-xs font-medium text-muted-foreground">
        {formatDateKr(item.date)}
      </p>

      {/* 감정 태그 배지 */}
      <div className="flex flex-wrap gap-1">
        {item.emotion_tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 text-xs py-0">
            <span aria-hidden="true">{EMOTION_ICONS[tag]}</span>
            {te(tag as Parameters<typeof te>[0])}
          </Badge>
        ))}
      </div>

      {/* 본문 발췌 (하이라이트 포함) */}
      <p className="text-sm text-foreground leading-relaxed">
        {item.segments.map((seg, i) =>
          seg.highlight ? (
            <mark
              key={i}
              className="bg-yellow-200 dark:bg-yellow-800 text-foreground rounded px-0.5"
            >
              {seg.text}
            </mark>
          ) : (
            <span key={i}>{seg.text}</span>
          )
        )}
      </p>
    </button>
  )
}

// 전체 감정 타입 목록 (순서 고정)
const ALL_EMOTIONS: EmotionType[] = [
  'happy', 'sad', 'angry', 'anxious', 'excited',
  'calm', 'tired', 'lonely', 'grateful', 'proud',
]

// 일기 검색 메인 컴포넌트
// - 키워드 입력 시 복호화된 본문에서 매칭 검색 (AC-01)
// - 감정 태그 필터링 (AC-02)
// - 매칭 키워드 하이라이트 (AC-03)
export function DiarySearch() {
  const router = useRouter()
  const t = useTranslations('private.diary')
  const tCommon = useTranslations('common')

  const [keyword, setKeyword] = useState('')
  const [selectedEmotions, setSelectedEmotions] = useState<EmotionType[]>([])

  const { data: rawDiaries, isLoading, error } = useDiarySearch(12)

  // sessionStorage에서 암호화 키 확인
  const encKey = typeof window !== 'undefined'
    ? sessionStorage.getItem('enc_key')
    : null

  // 복호화 후 검색/필터링
  const searchResults = useMemo<SearchResultItem[]>(() => {
    // enc_key 없으면 빈 배열 반환 (에러 UI는 별도 처리)
    if (!rawDiaries || !encKey) return []

    const trimmedKeyword = keyword.trim()

    return rawDiaries
      .filter((diary) => {
        // 1. 감정 태그 필터 (선택된 감정이 있을 경우만 필터)
        if (selectedEmotions.length > 0) {
          const hasMatchingEmotion = selectedEmotions.some((e) =>
            diary.emotion_tags.includes(e)
          )
          if (!hasMatchingEmotion) return false
        }

        // 2. 키워드 필터 (키워드가 있을 경우만 필터)
        if (trimmedKeyword) {
          let decryptedContent: string
          try {
            decryptedContent = decrypt(diary.content_encrypted, encKey)
          } catch {
            // 복호화 실패 항목은 제외
            return false
          }
          return decryptedContent.toLowerCase().includes(trimmedKeyword.toLowerCase())
        }

        return true
      })
      .map((diary) => {
        let content: string
        try {
          content = decrypt(diary.content_encrypted, encKey)
        } catch {
          content = ''
        }

        return {
          id: diary.id,
          date: diary.date,
          content,
          emotion_tags: diary.emotion_tags,
          excerpt: '',
          segments: buildExcerptSegments(content, trimmedKeyword),
        }
      })
  }, [rawDiaries, encKey, keyword, selectedEmotions])

  // 감정 태그 토글
  function toggleEmotion(emotion: EmotionType) {
    setSelectedEmotions((prev) =>
      prev.includes(emotion)
        ? prev.filter((e) => e !== emotion)
        : [...prev, emotion]
    )
  }

  // 검색 결과 클릭 시 해당 날짜 일기 페이지로 이동
  function handleResultClick(date: string) {
    router.push(`/private/diary?date=${encodeURIComponent(date)}`)
  }

  // 필터 초기화
  function resetFilters() {
    setKeyword('')
    setSelectedEmotions([])
  }

  const hasFilters = keyword.trim() || selectedEmotions.length > 0
  const showResults = hasFilters && !isLoading

  return (
    <div className="flex flex-col gap-4">
      {/* 암호화 키 없음 에러 */}
      {!encKey && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          {t('pinExpired')}
        </div>
      )}

      {/* 키워드 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-9"
          aria-label={t('search')}
          disabled={!encKey}
        />
      </div>

      {/* 감정 태그 필터 */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">{t('emotionFilter')}</p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_EMOTIONS.map((emotion) => (
            <EmotionFilterButton
              key={emotion}
              emotionType={emotion}
              selected={selectedEmotions.includes(emotion)}
              onToggle={toggleEmotion}
            />
          ))}
        </div>
      </div>

      {/* 필터 초기화 버튼 */}
      {hasFilters && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-xs text-muted-foreground"
          >
            {t('resetFilter')}
          </Button>
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{t('searching')}</span>
        </div>
      )}

      {/* API 오류 */}
      {error && (
        <div
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
          role="alert"
        >
          {error.message}
        </div>
      )}

      {/* 검색 결과 */}
      {showResults && (
        <div className="space-y-3">
          {searchResults.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">
              {tCommon('noResults')}
            </p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {t('foundCount', { count: searchResults.length })}
              </p>
              {searchResults.map((item) => (
                <SearchResultCard
                  key={item.id}
                  item={item}
                  onClick={handleResultClick}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* 필터 미입력 안내 */}
      {!hasFilters && !isLoading && encKey && (
        <p className="text-center text-sm text-muted-foreground py-8">
          {t('enterKeyword')}
        </p>
      )}
    </div>
  )
}
