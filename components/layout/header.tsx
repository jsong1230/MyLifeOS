'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Settings } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useSettingsStore } from '@/store/settings.store'

// 상단 헤더 — 경로별 제목 + 사용자 아바타 + 설정 링크
export function Header() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const nickname = useSettingsStore((s) => s.nickname)
  const t = useTranslations()

  const PAGE_TITLES: Record<string, string> = {
    '/': 'My Life OS',
    '/time': t('nav.time'),
    '/money': t('nav.money'),
    '/health': t('nav.health'),
    '/private': t('nav.private'),
    '/settings': t('nav.settings'),
  }

  const title =
    Object.entries(PAGE_TITLES).find(([path]) =>
      path === '/' ? pathname === '/' : pathname.startsWith(path),
    )?.[1] ?? 'My Life OS'

  // 닉네임 우선 → Google 이름 → 이메일 → 'U' 순서로 이니셜 표시
  const displayName = nickname ?? user?.user_metadata?.full_name ?? null
  const initial = (displayName?.[0] ?? user?.email?.[0] ?? 'U').toUpperCase()

  return (
    <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 bg-background/95 backdrop-blur border-b">
      <span className="font-semibold text-base truncate">{title}</span>
      <div className="flex items-center gap-2">
        {/* 사용자 아바타 */}
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          {user?.user_metadata?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.user_metadata.avatar_url}
              alt={t('auth.profileImage')}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-xs font-medium text-primary">{initial}</span>
          )}
        </div>
        {/* 설정 링크 */}
        <Link href="/settings" aria-label={t('nav.settings')}>
          <Settings className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
        </Link>
      </div>
    </header>
  )
}
