'use client'

import { useState, useCallback, useMemo } from 'react'
import { useLocale } from 'next-intl'

// 캘린더 뷰 타입
export type CalendarView = 'month' | 'week' | 'day'

// 날짜 셀 정보
export interface CalendarDay {
  date: string           // YYYY-MM-DD
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
}

// Date 객체를 YYYY-MM-DD 문자열로 포맷
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 오늘 날짜 문자열 반환
function getTodayStr(): string {
  return formatDate(new Date())
}

// 월간 캘린더 날짜 그리드 생성 (42칸 고정 = 6주)
export function generateMonthDays(
  year: number,
  month: number,
  selectedDate: string
): CalendarDay[] {
  const todayStr = getTodayStr()
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startDow = firstDay.getDay() // 0=일, 1=월, ..., 6=토

  const days: CalendarDay[] = []

  // 이전 달 날짜 채우기 (월 시작 요일 이전)
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i)
    const dateStr = formatDate(d)
    days.push({
      date: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
    })
  }

  // 이번 달 날짜
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month - 1, d)
    const dateStr = formatDate(date)
    days.push({
      date: dateStr,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
    })
  }

  // 다음 달 날짜 채우기 (42칸 채울 때까지)
  let nextMonthDay = 1
  while (days.length < 42) {
    const date = new Date(year, month, nextMonthDay)
    const dateStr = formatDate(date)
    days.push({
      date: dateStr,
      isCurrentMonth: false,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
    })
    nextMonthDay++
  }

  return days
}

// 주간 캘린더 날짜 배열 생성 (선택된 날짜 기준 해당 주 7일)
export function generateWeekDays(
  selectedDate: string,
  currentYear: number,
  currentMonth: number
): CalendarDay[] {
  const todayStr = getTodayStr()

  // 선택된 날짜의 Date 객체 생성
  const baseDate = selectedDate
    ? new Date(selectedDate + 'T00:00:00')
    : new Date(currentYear, currentMonth - 1, 1)

  // 해당 주의 일요일 찾기
  const dow = baseDate.getDay()
  const sunday = new Date(baseDate)
  sunday.setDate(baseDate.getDate() - dow)

  const days: CalendarDay[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    const dateStr = formatDate(d)
    days.push({
      date: dateStr,
      isCurrentMonth: d.getMonth() + 1 === currentMonth,
      isToday: dateStr === todayStr,
      isSelected: dateStr === selectedDate,
    })
  }

  return days
}

// 캘린더 상태 관리 훅
export function useCalendar() {
  const today = new Date()
  const todayStr = formatDate(today)

  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  })
  const [view, setView] = useState<CalendarView>('month')

  // 이전 달로 이동
  const prevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 }
      return { year: prev.year, month: prev.month - 1 }
    })
  }, [])

  // 다음 달로 이동
  const nextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 12) return { year: prev.year + 1, month: 1 }
      return { year: prev.year, month: prev.month + 1 }
    })
  }, [])

  // 오늘로 이동
  const goToToday = useCallback(() => {
    const now = new Date()
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() + 1 })
    setSelectedDate(formatDate(now))
  }, [])

  // 날짜 선택 시 해당 달도 맞게 이동
  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date)
    const [year, month] = date.split('-').map(Number)
    if (!isNaN(year) && !isNaN(month)) {
      setCurrentMonth({ year, month })
    }
  }, [])

  // 월간 달력 그리드
  const monthDays = useMemo(
    () => generateMonthDays(currentMonth.year, currentMonth.month, selectedDate),
    [currentMonth.year, currentMonth.month, selectedDate]
  )

  // 주간 달력 그리드
  const weekDays = useMemo(
    () => generateWeekDays(selectedDate, currentMonth.year, currentMonth.month),
    [selectedDate, currentMonth.year, currentMonth.month]
  )

  // 현재 월 표시 문자열 (로케일에 따라 자동 포맷)
  const locale = useLocale()
  const monthLabel = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
    new Date(currentMonth.year, currentMonth.month - 1, 1)
  )

  // 현재 달의 YYYY-MM 문자열
  const monthQuery = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}`

  return {
    selectedDate,
    setSelectedDate: handleSelectDate,
    currentMonth,
    view,
    setView,
    prevMonth,
    nextMonth,
    goToToday,
    monthDays,
    weekDays,
    monthLabel,
    monthQuery,
    todayStr,
  }
}
