'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TIME_NAV_ITEMS = [
  { label: '할일', href: '/time' },
  { label: '캘린더', href: '/time/calendar' },
  { label: '루틴', href: '/time/routines' },
  { label: '타임블록', href: '/time/blocks' },
  { label: '통계', href: '/time/stats' },
] as const

// 시간 관리 모듈 레이아웃 — 서브 네비게이션 포함
export default function TimeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/time') return pathname === '/time'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full w-full min-w-0">
      {/* 서브 네비게이션 탭 */}
      <div className="border-b bg-background sticky top-0 z-10">
        <nav className="flex px-4" aria-label="시간 관리 서브메뉴">
          {TIME_NAV_ITEMS.map(({ label, href }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
}
