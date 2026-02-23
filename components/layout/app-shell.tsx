'use client'

import { Header } from '@/components/layout/header'
import { BottomNav } from '@/components/layout/bottom-nav'
import { Sidebar } from '@/components/layout/sidebar'
import { FAB } from '@/components/layout/fab'

interface AppShellProps {
  children: React.ReactNode
}

// 대시보드 전체 레이아웃 셸 — 헤더, 사이드바(데스크탑), 하단 네비(모바일), FAB 조합
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-20">
        <Sidebar />
      </aside>

      {/* 메인 영역 */}
      <div className="flex-1 md:ml-64 flex flex-col">
        <Header />
        <main
          className="flex-1 px-4 pt-4 pb-24 md:pb-8"
          style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {children}
        </main>
      </div>

      {/* 모바일 하단 네비게이션 */}
      <div className="fixed bottom-0 inset-x-0 z-40 md:hidden">
        <BottomNav />
      </div>

      {/* FAB */}
      <FAB />
    </div>
  )
}
