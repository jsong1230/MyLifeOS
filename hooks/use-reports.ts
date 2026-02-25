'use client'

import { useQuery } from '@tanstack/react-query'
import type { CurrencyCode } from '@/lib/currency'
import type { WeeklyReport, MonthlyReport } from '@/types/report'

// ─── 주간 리포트 훅 ──────────────────────────────────────────

/**
 * 주간 리포트 조회 훅
 * @param weekStart 주 시작 월요일 날짜 (YYYY-MM-DD)
 * @param currency  표시 통화 코드 (기본 'KRW')
 */
export function useWeeklyReport(weekStart: string, currency: CurrencyCode = 'KRW') {
  return useQuery<WeeklyReport>({
    queryKey: ['reports', 'weekly', weekStart, currency],
    queryFn: async () => {
      const res = await fetch(
        `/api/reports/weekly?week=${encodeURIComponent(weekStart)}&currency=${currency}`
      )
      const json = await res.json() as { success: boolean; data: WeeklyReport; error?: string }
      if (!json.success) throw new Error(json.error ?? '주간 리포트 조회 실패')
      return json.data
    },
    enabled: !!weekStart,
  })
}

// ─── 월간 리포트 훅 ──────────────────────────────────────────

/**
 * 월간 리포트 조회 훅
 * @param year     연도 (예: 2026)
 * @param month    월 1~12 (예: 2)
 * @param currency 표시 통화 코드 (기본 'KRW')
 */
export function useMonthlyReport(year: number, month: number, currency: CurrencyCode = 'KRW') {
  return useQuery<MonthlyReport>({
    queryKey: ['reports', 'monthly', year, month, currency],
    queryFn: async () => {
      const res = await fetch(`/api/reports/monthly?year=${year}&month=${month}&currency=${currency}`)
      const json = await res.json() as { success: boolean; data: MonthlyReport; error?: string }
      if (!json.success) throw new Error(json.error ?? '월간 리포트 조회 실패')
      return json.data
    },
    enabled: !!year && !!month,
  })
}
