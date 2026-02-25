'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

const TIME_NAV_ITEMS = [
  { labelKey: 'time.todos.title', href: '/time' },
  { labelKey: 'time.calendar.title', href: '/time/calendar' },
  { labelKey: 'time.routines.title', href: '/time/routines' },
  { labelKey: 'time.blocks.title', href: '/time/blocks' },
  { labelKey: 'time.stats.title', href: '/time/stats' },
] as const

// 시간 관리 모듈 레이아웃 — 서브 네비게이션 포함
export default function TimeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const t = useTranslations()

  function isActive(href: string) {
    if (href === '/time') return pathname === '/time'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full w-full min-w-0">
      {/* 서브 네비게이션 탭 */}
      <div className="border-b bg-background sticky top-0 z-10">
        <nav className="flex px-4" aria-label={t('nav.timeSubMenu')}>
          {TIME_NAV_ITEMS.map(({ labelKey, href }) => {
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
