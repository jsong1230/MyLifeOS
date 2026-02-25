'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const HEALTH_NAV_ITEMS = [
  { label: '대시보드', href: '/health' },
  { label: '식사', href: '/health/meals' },
  { label: '음주', href: '/health/drinks' },
  { label: '수면', href: '/health/sleep' },
  { label: '체중', href: '/health/body' },
  { label: '운동', href: '/health/exercise' },
  { label: '목표', href: '/health/diet-goal' },
] as const

// 건강 관리 모듈 레이아웃 — 서브 네비게이션 포함
export default function HealthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/health') return pathname === '/health'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full w-full min-w-0">
      <div className="border-b bg-background sticky top-0 z-10">
        <nav className="flex px-4 overflow-x-auto" aria-label="건강 관리 서브메뉴">
          {HEALTH_NAV_ITEMS.map(({ label, href }) => {
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
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  )
}
