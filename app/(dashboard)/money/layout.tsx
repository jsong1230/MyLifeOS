'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const MONEY_NAV_ITEMS = [
  { label: '대시보드', href: '/money' },
  { label: '수입/지출', href: '/money/transactions' },
  { label: '예산', href: '/money/budget' },
  { label: '자산', href: '/money/assets' },
  { label: '정기지출', href: '/money/recurring' },
  { label: '카테고리', href: '/money/categories' },
] as const

// 금전 관리 모듈 레이아웃 — 서브 네비게이션 포함
export default function MoneyLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/money') return pathname === '/money'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 서브 네비게이션 탭 */}
      <div className="border-b bg-background sticky top-0 z-10">
        <nav className="flex px-4 overflow-x-auto" aria-label="금전 관리 서브메뉴">
          {MONEY_NAV_ITEMS.map(({ label, href }) => {
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
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </div>
  )
}
