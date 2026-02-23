'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Wallet, Heart, BookOpen, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { label: '홈', icon: Home, href: '/' },
  { label: '시간 관리', icon: Clock, href: '/time' },
  { label: '금전 관리', icon: Wallet, href: '/money' },
  { label: '건강 관리', icon: Heart, href: '/health' },
  { label: '사적 기록', icon: BookOpen, href: '/private' },
] as const

// 데스크탑 사이드바
export function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* 로고 */}
      <div className="h-14 flex items-center px-6 border-b">
        <span className="font-bold text-base">My Life OS</span>
      </div>

      {/* 네비게이션 */}
      <nav role="navigation" aria-label="사이드 메뉴" className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* 설정 */}
      <div className="px-3 py-4 border-t">
        <Link
          href="/settings"
          aria-current={pathname === '/settings' ? 'page' : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            pathname === '/settings'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" aria-hidden="true" />
          설정
        </Link>
      </div>
    </div>
  )
}
