import { InactivityProvider } from '@/components/common/inactivity-provider'
import { PinGuard } from '@/components/auth/pin-guard'
import { AppShell } from '@/components/layout/app-shell'

// 대시보드 전용 레이아웃 — 30분 비활동 자동 로그아웃 + PIN 잠금 + 공통 레이아웃 셸
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <InactivityProvider>
      <PinGuard>
        <AppShell>{children}</AppShell>
      </PinGuard>
    </InactivityProvider>
  )
}
