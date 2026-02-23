'use client'

import { useAuthStore } from '@/store/auth.store'

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return '좋은 아침이에요'
  if (hour >= 12 && hour < 18) return '좋은 오후예요'
  if (hour >= 18 && hour < 22) return '좋은 저녁이에요'
  return '오늘도 수고했어요'
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })
}

// 시간대별 인사말 + 사용자 이름 + 오늘 날짜 표시
export function GreetingHeader() {
  const user = useAuthStore((s) => s.user)
  const now = new Date()
  const greeting = getGreeting(now.getHours())
  const name =
    user?.user_metadata?.full_name ??
    user?.email?.split('@')[0] ??
    '사용자'

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold">
        {greeting}, {name}님
      </h2>
      <p className="text-sm text-muted-foreground mt-1">{formatDate(now)}</p>
    </div>
  )
}
