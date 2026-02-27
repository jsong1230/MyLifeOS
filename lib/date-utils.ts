/**
 * 날짜 유틸 — 로컬 타임존 기준 통일
 *
 * 기존에 6개 이상 파일에서 중복 구현되던 getToday(), getMonthRange() 등을 통합.
 * UTC(toISOString) 대신 로컬 타임존(getFullYear/getMonth/getDate)을 일관 사용하여
 * 사용자의 현지 날짜와 항상 일치하도록 보장.
 */

/** Date → 'YYYY-MM-DD' (로컬 타임존) */
export function formatDateToString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 오늘 날짜 'YYYY-MM-DD' (로컬 타임존) */
export function getToday(): string {
  return formatDateToString(new Date())
}

/** 현재 월 'YYYY-MM' (로컬 타임존) */
export function getCurrentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** 해당 월의 시작일/종료일 (inclusive) — 'YYYY-MM-DD' */
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { start, end }
}

/** 현재 월의 시작일/종료일 (inclusive) */
export function getCurrentMonthRange(): { start: string; end: string } {
  const d = new Date()
  return getMonthRange(d.getFullYear(), d.getMonth() + 1)
}

/** 전월의 year/month 계산 */
export function getPrevMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}
