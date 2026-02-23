'use client'

import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useWeeklyReport, useMonthlyReport } from '@/hooks/use-reports'
import { WeeklyReportView } from '@/components/reports/weekly-report'
import { MonthlyReportView } from '@/components/reports/monthly-report'

// 오늘 날짜 기준으로 이번 주 월요일(주 시작) 반환 (YYYY-MM-DD)
function getCurrentWeekStart(): string {
  const today = new Date()
  const day = today.getDay() // 0=일, 1=월, ..., 6=토
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(today)
  monday.setDate(today.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

// YYYY-MM-DD 날짜에 N일을 더한 날짜 반환
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

// YYYY-MM-DD 형식의 주 시작일을 한국어 주 범위 문자열로 변환
function formatWeekLabel(weekStart: string): string {
  const start = new Date(weekStart)
  const end = new Date(weekStart)
  end.setDate(start.getDate() + 6)

  const fmt = (d: Date) =>
    `${d.getMonth() + 1}월 ${d.getDate()}일`

  return `${fmt(start)} ~ ${fmt(end)}`
}

// 연/월 한국어 포맷 (예: 2026년 2월)
function formatMonthLabel(year: number, month: number): string {
  return `${year}년 ${month}월`
}

// 탭 타입
type TabType = 'weekly' | 'monthly'

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('weekly')

  // 주간 — 현재 주 시작일 상태
  const [weekStart, setWeekStart] = useState<string>(getCurrentWeekStart)

  // 월간 — 현재 연/월 상태
  const [year, setYear] = useState<number>(() => new Date().getFullYear())
  const [month, setMonth] = useState<number>(() => new Date().getMonth() + 1)

  // 주간 네비게이션
  const goToPrevWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, -7))
  }, [])

  const goToNextWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, 7))
  }, [])

  // 월간 네비게이션
  const goToPrevMonth = useCallback(() => {
    setYear((y) => (month === 1 ? y - 1 : y))
    setMonth((m) => (m === 1 ? 12 : m - 1))
  }, [month])

  const goToNextMonth = useCallback(() => {
    setYear((y) => (month === 12 ? y + 1 : y))
    setMonth((m) => (m === 12 ? 1 : m + 1))
  }, [month])

  // 리포트 데이터 조회
  const {
    data: weeklyData,
    isLoading: weeklyLoading,
    isError: weeklyError,
  } = useWeeklyReport(activeTab === 'weekly' ? weekStart : '')

  const {
    data: monthlyData,
    isLoading: monthlyLoading,
    isError: monthlyError,
  } = useMonthlyReport(
    activeTab === 'monthly' ? year : 0,
    activeTab === 'monthly' ? month : 0
  )

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-5">리포트</h1>

      {/* ── 탭 전환 ── */}
      <div className="flex bg-muted rounded-lg p-1 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('weekly')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'weekly'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-pressed={activeTab === 'weekly'}
        >
          주간
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'monthly'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-pressed={activeTab === 'monthly'}
        >
          월간
        </button>
      </div>

      {/* ── 주간 탭 ── */}
      {activeTab === 'weekly' && (
        <>
          {/* 주 탐색 헤더 */}
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={goToPrevWeek}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="이전 주"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <span className="text-sm font-medium">{formatWeekLabel(weekStart)}</span>
            <button
              type="button"
              onClick={goToNextWeek}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="다음 주"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* 주간 리포트 콘텐츠 */}
          {weeklyLoading && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              리포트를 불러오는 중...
            </div>
          )}
          {weeklyError && (
            <div className="py-16 text-center text-sm text-destructive">
              리포트 로딩에 실패했습니다
            </div>
          )}
          {weeklyData && <WeeklyReportView report={weeklyData} />}
        </>
      )}

      {/* ── 월간 탭 ── */}
      {activeTab === 'monthly' && (
        <>
          {/* 월 탐색 헤더 */}
          <div className="flex items-center justify-between mb-5">
            <button
              type="button"
              onClick={goToPrevMonth}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="이전 달"
            >
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <span className="text-sm font-medium">{formatMonthLabel(year, month)}</span>
            <button
              type="button"
              onClick={goToNextMonth}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="다음 달"
            >
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* 월간 리포트 콘텐츠 */}
          {monthlyLoading && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              리포트를 불러오는 중...
            </div>
          )}
          {monthlyError && (
            <div className="py-16 text-center text-sm text-destructive">
              리포트 로딩에 실패했습니다
            </div>
          )}
          {monthlyData && <MonthlyReportView report={monthlyData} />}
        </>
      )}
    </div>
  )
}
