'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Wallet, Heart, BookOpen, BarChart2 } from 'lucide-react'

const NAV_ITEMS = [
  { label: '홈', icon: Home, href: '/' },
  { label: '시간', icon: Clock, href: '/time' },
  { label: '금전', icon: Wallet, href: '/money' },
  { label: '건강', icon: Heart, href: '/health' },
  { label: '기록', icon: BookOpen, href: '/private' },
  { label: '리포트', icon: BarChart2, href: '/reports' },
] as const

// 모바일 하단 네비게이션 바
export function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      role="navigation"
      aria-label="메인 메뉴"
      className="bg-background border-t h-16 flex items-center"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
        const active = isActive(href)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-col items-center justify-center flex-1 gap-1 text-xs transition-colors ${
              active ? 'text-primary font-medium' : 'text-muted-foreground'
            }`}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
