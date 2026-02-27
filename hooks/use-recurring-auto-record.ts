'use client'

import { useMemo } from 'react'
import type { RecurringExpense } from '@/types/recurring'

function getCurrentYearMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function getUnrecordedItems(expenses: RecurringExpense[]): RecurringExpense[] {
  const today = new Date()
  const currentYearMonth = getCurrentYearMonth()

  return expenses.filter((expense) => {
    if (!expense.is_active) return false
    if (expense.cycle !== 'monthly') return false

    // 이번 달 결제일이 지났는지 확인
    const billingDay = expense.billing_day
    if (today.getDate() < billingDay) return false

    // last_recorded_date가 이번 달인지 확인
    if (expense.last_recorded_date) {
      const recordedMonth = expense.last_recorded_date.slice(0, 7)
      if (recordedMonth === currentYearMonth) return false
    }

    return true
  })
}

export function useRecurringUnrecorded(expenses: RecurringExpense[]) {
  return useMemo(() => getUnrecordedItems(expenses), [expenses])
}
