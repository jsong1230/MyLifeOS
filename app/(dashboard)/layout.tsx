import { InactivityProvider } from '@/components/common/inactivity-provider'
import { PinGuard } from '@/components/auth/pin-guard'

// 대시보드 전용 레이아웃 — 30분 비활동 자동 로그아웃 + PIN 잠금 적용
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <InactivityProvider>
      <PinGuard>{children}</PinGuard>
    </InactivityProvider>
  )
}
