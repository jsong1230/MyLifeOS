'use client'

import { useTranslations } from 'next-intl'
import { EMOTION_ICONS, type EmotionType } from '@/types/diary'
import type { EmotionStatsData } from '@/app/api/diaries/emotion-stats/route'

interface EmotionHeatmapProps {
  year: number
  month: number
  stats: EmotionStatsData
}

// 요일 키 (일요일 시작)
const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

// 날짜 문자열 생성 헬퍼 ('YYYY-MM-DD')
function toDateString(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

// 오늘 날짜 문자열 반환
function getTodayString(): string {
  const now = new Date()
  return toDateString(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

// 달력 셀 타입
interface HeatmapCell {
  date: string            // 'YYYY-MM-DD'
  day: number             // 날짜 숫자
  isCurrentMonth: boolean // 이번 달 여부
}

// 캘린더 그리드 생성 (6주 x 7일)
function buildCalendarCells(year: number, month: number): HeatmapCell[] {
  const cells: HeatmapCell[] = []

  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const lastDateOfMonth = new Date(year, month, 0).getDate()
  const lastDateOfPrevMonth = new Date(year, month - 1, 0).getDate()

  // 이전 달 날짜로 앞쪽 채우기
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = lastDateOfPrevMonth - i
    cells.push({
      date: toDateString(prevYear, prevMonth, day),
      day,
      isCurrentMonth: false,
    })
  }

  // 이번 달 날짜 채우기
  for (let day = 1; day <= lastDateOfMonth; day++) {
    cells.push({
      date: toDateString(year, month, day),
      day,
      isCurrentMonth: true,
    })
  }

  // 다음 달 날짜로 뒤쪽 채우기 (7의 배수로 맞춤)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const remaining = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7)
  for (let day = 1; day <= remaining; day++) {
    cells.push({
      date: toDateString(nextYear, nextMonth, day),
      day,
      isCurrentMonth: false,
    })
  }

  return cells
}

// 요일별 감정 패턴 히트맵 컴포넌트 (Tailwind 전용)
export function EmotionHeatmap({ year, month, stats }: EmotionHeatmapProps) {
  const tCalendar = useTranslations('time.calendar')
  const tEmotions = useTranslations('private.emotions')

  const cells = buildCalendarCells(year, month)
  const today = getTodayString()

  // 날짜 → 첫 번째 감정 태그 매핑 (이번 달 일기 데이터 기반)
  // weekday_map은 요일별 집계이므로, 개별 날짜 감정은 별도로 표시
  // 각 날짜의 감정은 weekday_map에서 해당 날짜 요일의 가장 많은 감정으로 대표 표시
  // 실제 날짜별 데이터를 보여주기 위해 emotion_counts를 기반으로 날짜별 대표 감정을 구함

  // weekday_map: 0=일~6=토, 각 요일에 등록된 감정 목록
  // 날짜별 대표 감정: 해당 날짜(요일)에 가장 많이 등장한 감정
  function getRepresentativeEmotion(date: string): EmotionType | undefined {
    const [y, m, d] = date.split('-').map(Number)
    const weekday = new Date(y, m - 1, d).getDay()
    const emotions = stats.weekday_map[String(weekday)]
    if (!emotions || emotions.length === 0) return undefined

    // 해당 요일 감정들 중 가장 빈번한 감정 반환
    const counts: Partial<Record<EmotionType, number>> = {}
    for (const emotion of emotions) {
      counts[emotion] = (counts[emotion] ?? 0) + 1
    }
    return (Object.entries(counts) as Array<[EmotionType, number]>)
      .sort(([, a], [, b]) => b - a)[0][0]
  }

  return (
    <section aria-label={tEmotions('weekdayPattern')}>
      <h2 className="text-sm font-semibold text-foreground mb-3">{tEmotions('weekdayPattern')}</h2>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_KEYS.map((key) => (
          <div
            key={key}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {tCalendar(`weekdays.${key}`)}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {cells.map((cell) => {
          // 이번 달 날짜에만 감정 아이콘 표시
          const emotion = cell.isCurrentMonth
            ? getRepresentativeEmotion(cell.date)
            : undefined
          const isToday = cell.date === today

          return (
            <div
              key={cell.date}
              className={[
                'bg-background min-h-[56px] p-1 flex flex-col items-center gap-0.5',
                !cell.isCurrentMonth ? 'bg-muted/40' : '',
              ].join(' ')}
            >
              {/* 날짜 숫자 */}
              <span
                className={[
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                  !cell.isCurrentMonth ? 'text-muted-foreground/40' : '',
                  isToday ? 'bg-primary text-primary-foreground font-bold' : '',
                  cell.isCurrentMonth && !isToday ? 'text-foreground' : '',
                ].filter(Boolean).join(' ')}
              >
                {cell.day}
              </span>

              {/* 감정 이모지 (이번 달 + 감정 있는 경우만) */}
              {emotion ? (
                <span
                  className="text-base leading-none"
                  role="img"
                  aria-label={tEmotions(emotion as Parameters<typeof tEmotions>[0])}
                  title={tEmotions(emotion as Parameters<typeof tEmotions>[0])}
                >
                  {EMOTION_ICONS[emotion]}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
