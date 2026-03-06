'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BookMarked, ChevronRight } from 'lucide-react'
import { EmptyState } from '@/components/dashboard/empty-state'
import { useBooks } from '@/hooks/use-books'

// 독서 요약 카드 — 읽는 중인 책 수 + 최근 읽은 책 제목
export function BookSummaryCard() {
  const t = useTranslations('books')
  const td = useTranslations('dashboard')
  const { data, isLoading } = useBooks()

  const readingBooks = data?.data.filter((b) => b.status === 'reading') ?? []
  const stats = data?.stats ?? { total: 0, reading: 0, completed: 0 }
  const latestReading = readingBooks[0] ?? null

  return (
    <Link href="/books" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('title')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ) : stats.reading > 0 ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                {t('stats_reading')}: <strong>{stats.reading}</strong>
                {stats.completed > 0 && (
                  <span className="ml-2">{t('stats_completed')}: <strong>{stats.completed}</strong></span>
                )}
              </p>
              {latestReading && (
                <p className="text-sm font-medium line-clamp-1">{latestReading.title}</p>
              )}
              {latestReading?.author && (
                <p className="text-xs text-muted-foreground">{latestReading.author}</p>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<BookMarked />}
              title={td('noBooksYet')}
              description={td('noBooksDesc')}
            />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
