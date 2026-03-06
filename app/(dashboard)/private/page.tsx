'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { BookOpen, Search, SmilePlus, BarChart2, Users, StickyNote } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

// 사적 기록 모듈 홈
export default function PrivatePage() {
  const t = useTranslations('private')

  const MENU_ITEMS = [
    {
      href: '/private/diary',
      icon: BookOpen,
      title: t('diary.title'),
      description: t('menu.diary.description'),
      color: 'text-violet-500',
    },
    {
      href: '/private/diary/search',
      icon: Search,
      title: t('menu.diarySearch.title'),
      description: t('menu.diarySearch.description'),
      color: 'text-blue-500',
    },
    {
      href: '/private/emotion',
      icon: SmilePlus,
      title: t('menu.emotionCalendar.title'),
      description: t('menu.emotionCalendar.description'),
      color: 'text-yellow-500',
    },
    {
      href: '/private/emotion/stats',
      icon: BarChart2,
      title: t('menu.emotionStats.title'),
      description: t('menu.emotionStats.description'),
      color: 'text-pink-500',
    },
    {
      href: '/private/relations',
      icon: Users,
      title: t('relations.title'),
      description: t('menu.relations.description'),
      color: 'text-green-500',
    },
    {
      href: '/private/memos',
      icon: StickyNote,
      title: t('memos.title'),
      description: t('menu.memos.description'),
      color: 'text-orange-500',
    },
  ]

  return (
    <div className="px-4 pt-2 max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">{t('title')}</h1>
      <div className="grid grid-cols-1 gap-3">
        {MENU_ITEMS.map(({ href, icon: Icon, title, description, color }) => (
          <Link key={href} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="flex items-center gap-4 py-4">
                <Icon className={`w-6 h-6 shrink-0 ${color}`} />
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
