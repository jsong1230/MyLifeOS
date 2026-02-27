'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth.store'

// 앱 마운트 시 Supabase 세션 → Zustand store 동기화 컴포넌트
function AuthInitializer() {
  const { setUser, setLoading } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    // 현재 세션에서 사용자 즉시 로드
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // 로그인/로그아웃/토큰갱신/사용자정보변경 시 store 동기화
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

// React Query 전역 Provider — 클라이언트 사이드 캐싱 설정
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,  // 5분 — 불필요한 refetch 방지
            gcTime: 10 * 60 * 1000,    // 10분 — 캐시 보존
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* OS 시스템 설정 기반 다크/라이트 자동 전환, class 전략 사용 */}
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthInitializer />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
