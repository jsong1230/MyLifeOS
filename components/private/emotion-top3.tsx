'use client'

import { EMOTION_ICONS, EMOTION_LABELS, type EmotionType } from '@/types/diary'
import type { EmotionStatsData } from '@/app/api/diaries/emotion-stats/route'

interface EmotionTop3Props {
  stats: EmotionStatsData
}

// 순위별 배지 스타일
const RANK_STYLES: Record<number, { badge: string; card: string }> = {
  1: {
    badge: 'bg-yellow-400 text-yellow-900',
    card: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800',
  },
  2: {
    badge: 'bg-gray-300 text-gray-700',
    card: 'border-gray-200 bg-gray-50 dark:bg-gray-900/20 dark:border-gray-700',
  },
  3: {
    badge: 'bg-amber-600 text-amber-100',
    card: 'border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800',
  },
}

// 순위 레이블
const RANK_LABELS: Record<number, string> = {
  1: '1위',
  2: '2위',
  3: '3위',
}

// 감정 TOP 3 하이라이트 컴포넌트
export function EmotionTop3({ stats }: EmotionTop3Props) {
  const { top3, emotion_counts } = stats

  // top3가 비어있으면 안내 메시지 표시
  if (top3.length === 0) {
    return (
      <section aria-label="이번 달 감정 TOP 3">
        <h2 className="text-sm font-semibold text-foreground mb-3">이번 달 감정 TOP 3</h2>
        <p className="text-sm text-muted-foreground text-center py-4">
          아직 감정 기록이 없습니다
        </p>
      </section>
    )
  }

  return (
    <section aria-label="이번 달 감정 TOP 3">
      <h2 className="text-sm font-semibold text-foreground mb-3">이번 달 감정 TOP 3</h2>
      <div className="grid grid-cols-3 gap-3">
        {top3.map((emotion: EmotionType, index: number) => {
          const rank = index + 1
          const count = emotion_counts[emotion] ?? 0
          const styles = RANK_STYLES[rank]

          return (
            <div
              key={emotion}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 ${styles.card}`}
            >
              {/* 순위 배지 */}
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles.badge}`}
                aria-label={`${RANK_LABELS[rank]}`}
              >
                {RANK_LABELS[rank]}
              </span>

              {/* 감정 아이콘 */}
              <span
                className="text-3xl leading-none"
                role="img"
                aria-label={EMOTION_LABELS[emotion]}
              >
                {EMOTION_ICONS[emotion]}
              </span>

              {/* 감정 이름 */}
              <span className="text-xs font-medium text-foreground text-center">
                {EMOTION_LABELS[emotion]}
              </span>

              {/* 횟수 */}
              <span className="text-xs text-muted-foreground">
                {count}회
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
