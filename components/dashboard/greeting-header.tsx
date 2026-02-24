'use client'

import { useTranslations, useLocale } from 'next-intl'
import { useAuthStore } from '@/store/auth.store'

function formatDate(date: Date, locale: string): string {
  return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

// 시간대별 인사말 + 사용자 이름 + 오늘 날짜 표시
export function GreetingHeader() {
  const user = useAuthStore((s) => s.user)
  const t = useTranslations('dashboard')
  const commonT = useTranslations('common')
  const locale = useLocale()

  const now = new Date()
  const hour = now.getHours()

  function getGreeting(): string {
    if (hour >= 5 && hour < 12) return t('greetingMorning')
    if (hour >= 12 && hour < 18) return t('greetingAfternoon')
    if (hour >= 18 && hour < 22) return t('greetingEvening')
    return t('greetingNight')
  }

  const greeting = getGreeting()
  const name =
    user?.user_metadata?.full_name ??
    user?.email?.split('@')[0] ??
    commonT('user')

  const suffix = t('greetingSuffix')

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold">
        {greeting}, {name}{suffix}
      </h2>
      <p className="text-sm text-muted-foreground mt-1">{formatDate(now, locale)}</p>
    </div>
  )
}
