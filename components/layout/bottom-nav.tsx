'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Home, Clock, Wallet, Heart, BookOpen, BarChart2 } from 'lucide-react'

const NAV_ITEMS = [
  { key: 'home' as const, icon: Home, href: '/' },
  { key: 'time' as const, icon: Clock, href: '/time' },
  { key: 'money' as const, icon: Wallet, href: '/money' },
  { key: 'health' as const, icon: Heart, href: '/health' },
  { key: 'private' as const, icon: BookOpen, href: '/private' },
  { key: 'reports' as const, icon: BarChart2, href: '/reports' },
]

// 모바일 하단 네비게이션 바
export function BottomNav() {
  const pathname = usePathname()
  const t = useTranslations('nav')

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav
      role="navigation"
      aria-label={t('mainMenu')}
      className="bg-background border-t"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="h-16 flex items-center">
        {NAV_ITEMS.map(({ key, icon: Icon, href }) => {
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
              <span>{t(key)}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
