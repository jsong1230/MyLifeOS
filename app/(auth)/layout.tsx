import { Card } from '@/components/ui/card'

// 인증 전용 레이아웃 — 중앙 정렬 카드 구조
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">
        {/* 로고 및 앱명 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-3">
            M
          </div>
          <h1 className="text-2xl font-bold text-gray-900">My Life OS</h1>
        </div>
        <Card>{children}</Card>
      </div>
    </div>
  )
}
