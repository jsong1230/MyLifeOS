import { getLocale } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { LocaleToggle } from '@/components/auth/locale-toggle'

// 인증 전용 레이아웃 — 중앙 정렬 카드 구조
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const manualHref = locale === 'en' ? '/manual.en.html' : '/manual.html'
  const manualLabel = locale === 'en' ? 'User Guide' : '사용자 가이드'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">
        {/* 언어 토글 */}
        <div className="flex justify-end mb-4">
          <LocaleToggle currentLocale={locale} />
        </div>
        {/* 로고 및 앱명 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-3">
            M
          </div>
          <h1 className="text-2xl font-bold text-gray-900">My Life OS</h1>
        </div>
        <Card>{children}</Card>
        {/* 매뉴얼 링크 */}
        <p className="mt-6 text-center text-xs text-gray-400">
          <a
            href={manualHref}
            className="underline underline-offset-4 hover:text-gray-600 transition-colors"
          >
            {manualLabel}
          </a>
        </p>
      </div>
    </div>
  )
}
