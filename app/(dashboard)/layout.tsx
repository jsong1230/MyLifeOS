import { InactivityProvider } from '@/components/common/inactivity-provider'

// 대시보드 전용 레이아웃 — 30분 비활동 자동 로그아웃 적용
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <InactivityProvider>{children}</InactivityProvider>
}
