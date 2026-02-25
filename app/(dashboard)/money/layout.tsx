'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

const MONEY_NAV_ITEMS = [
  { labelKey: 'common.dashboard', href: '/money' },
  { labelKey: 'money.transactions.title', href: '/money/transactions' },
  { labelKey: 'money.budget.title', href: '/money/budget' },
  { labelKey: 'money.assets.title', href: '/money/assets' },
  { labelKey: 'money.recurring.title', href: '/money/recurring' },
  { labelKey: 'money.categories.title', href: '/money/categories' },
] as const

// 금전 관리 모듈 레이아웃 — 서브 네비게이션 포함
export default function MoneyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const t = useTranslations()

  function isActive(href: string) {
    if (href === '/money') return pathname === '/money'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full w-full min-w-0">
      {/* 서브 네비게이션 탭 */}
      <div className="border-b bg-background sticky top-0 z-10">
        <nav className="flex px-4 overflow-x-auto" aria-label="금전 관리 서브메뉴">
          {MONEY_NAV_ITEMS.map(({ labelKey, href }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {t(labelKey as Parameters<typeof t>[0])}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
}
