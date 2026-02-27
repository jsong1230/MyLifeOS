'use client'

import { useMemo } from 'react'
import { getCurrentMonth } from '@/lib/date-utils'
import type { RecurringExpense } from '@/types/recurring'

export function getUnrecordedItems(expenses: RecurringExpense[]): RecurringExpense[] {
  const today = new Date()
  const currentYearMonth = getCurrentMonth()
  const currentYear = String(today.getFullYear())

  return expenses.filter((expense) => {
    if (!expense.is_active) return false

    // 이번 달 결제일이 지났는지 확인
    const billingDay = expense.billing_day
    if (today.getDate() < billingDay) return false

    if (expense.last_recorded_date) {
      if (expense.cycle === 'monthly') {
        // monthly: 이번 달에 이미 기록되었으면 건너뜀
        const recordedMonth = expense.last_recorded_date.slice(0, 7)
        if (recordedMonth === currentYearMonth) return false
      } else if (expense.cycle === 'yearly') {
        // yearly: 올해에 이미 기록되었으면 건너뜀
        const recordedYear = expense.last_recorded_date.slice(0, 4)
        if (recordedYear === currentYear) return false
      }
    }

    return true
  })
}

export function useRecurringUnrecorded(expenses: RecurringExpense[]) {
  return useMemo(() => getUnrecordedItems(expenses), [expenses])
}
