'use client'

import { useInactivityTimeout } from '@/hooks/use-inactivity-timeout'

/**
 * 30분 비활동 자동 로그아웃 훅을 마운트하는 클라이언트 컴포넌트
 * 대시보드 레이아웃(서버 컴포넌트)에서 children과 함께 래핑하여 사용
 */
export function InactivityProvider({ children }: { children: React.ReactNode }) {
  useInactivityTimeout()
  return <>{children}</>
}
