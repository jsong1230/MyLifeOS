'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { EMOTION_ICONS, EMOTION_LABELS, type EmotionType } from '@/types/diary'

// 월별 일기 목록 아이템 타입 (useDiaryList 반환값과 동일)
interface DiaryListItem {
  id: string
  date: string            // 'YYYY-MM-DD'
  emotion_tags: EmotionType[]
}

interface EmotionCalendarProps {
  year: number
  month: number           // 1~12
  diaries: DiaryListItem[]
}

// 요일 헤더 (일요일 시작)
const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

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

interface CalendarDay {
  date: string            // 'YYYY-MM-DD'
  day: number             // 날짜 숫자
  isCurrentMonth: boolean // 현재 달 여부
}

// 캘린더 그리드 생성 (6주 × 7일 = 최대 42개 셀)
function buildCalendarDays(year: number, month: number): CalendarDay[] {
  const days: CalendarDay[] = []

  // 이번 달 1일의 요일 (0=일, 6=토)
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  // 이번 달 마지막 날짜
  const lastDateOfMonth = new Date(year, month, 0).getDate()
  // 이전 달 마지막 날짜
  const lastDateOfPrevMonth = new Date(year, month - 1, 0).getDate()

  // 이전 달 날짜로 앞쪽 채우기
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = lastDateOfPrevMonth - i
    days.push({
      date: toDateString(prevYear, prevMonth, day),
      day,
      isCurrentMonth: false,
    })
  }

  // 이번 달 날짜 채우기
  for (let day = 1; day <= lastDateOfMonth; day++) {
    days.push({
      date: toDateString(year, month, day),
      day,
      isCurrentMonth: true,
    })
  }

  // 다음 달 날짜로 뒤쪽 채우기 (총 셀 수를 7의 배수로 맞춤)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const remaining = days.length % 7 === 0 ? 0 : 7 - (days.length % 7)
  for (let day = 1; day <= remaining; day++) {
    days.push({
      date: toDateString(nextYear, nextMonth, day),
      day,
      isCurrentMonth: false,
    })
  }

  return days
}

// 월간 캘린더 컴포넌트
export function EmotionCalendar({ year, month, diaries }: EmotionCalendarProps) {
  const router = useRouter()
  const today = getTodayString()

  // 날짜 → 첫 번째 감정 태그 매핑
  const emotionMap = new Map<string, EmotionType>()
  for (const diary of diaries) {
    if (diary.emotion_tags.length > 0) {
      emotionMap.set(diary.date, diary.emotion_tags[0])
    }
  }

  const calendarDays = buildCalendarDays(year, month)

  // 감정 아이콘 있는 날짜 클릭 시 해당 날짜 일기 페이지로 이동
  function handleDayClick(date: string, hasEmotion: boolean) {
    if (!hasEmotion) return
    router.push(`/private/diary?date=${date}`)
  }

  return (
    <div className="w-full">
      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-medium text-muted-foreground py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {calendarDays.map((cell) => {
          const emotion = emotionMap.get(cell.date)
          const hasEmotion = emotion !== undefined
          const isToday = cell.date === today

          return (
            <div
              key={cell.date}
              className={cn(
                'bg-background min-h-[64px] p-1 flex flex-col items-center gap-1',
                // 이전/다음 달 날짜는 배경 살짝 어둡게
                !cell.isCurrentMonth && 'bg-muted/40',
              )}
            >
              {/* 날짜 숫자 */}
              <span
                className={cn(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                  // 이전/다음 달 날짜는 흐리게
                  !cell.isCurrentMonth && 'text-muted-foreground/40',
                  // 오늘 날짜 하이라이트
                  isToday && 'bg-primary text-primary-foreground font-bold',
                  // 이번 달이지만 오늘이 아닌 경우
                  cell.isCurrentMonth && !isToday && 'text-foreground',
                )}
              >
                {cell.day}
              </span>

              {/* 감정 아이콘 (있는 경우만 표시) */}
              {hasEmotion && emotion ? (
                <button
                  type="button"
                  onClick={() => handleDayClick(cell.date, true)}
                  aria-label={`${cell.date} 일기 보기 - ${EMOTION_LABELS[emotion]}`}
                  className={cn(
                    'text-xl leading-none rounded-full p-0.5 transition-transform',
                    'hover:scale-110 active:scale-95',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    // 이전/다음 달은 흐리게
                    !cell.isCurrentMonth && 'opacity-30',
                  )}
                >
                  {EMOTION_ICONS[emotion]}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
