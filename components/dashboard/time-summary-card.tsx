'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Clock, ListTodo, ChevronRight } from 'lucide-react'
import { useDashboardSummary } from '@/hooks/use-dashboard-summary'

// 시간 모듈 요약 카드 — 오늘 할일 현황
export function TimeSummaryCard() {
  const t = useTranslations('dashboard')
  const { data, isLoading } = useDashboardSummary()

  const { total, completed } = data?.todos ?? { total: 0, completed: 0 }
  const pending = total - completed

  return (
    <Link href="/time" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{t('timeSummary')}</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-1.5 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ) : total > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{t('todayTodos')}</span>
                <span className="text-xs font-medium">{t('completedFraction', { completed, total })}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.round((completed / total) * 100)}%` }}
                />
              </div>
              {pending > 0 && (
                <p className="text-xs text-muted-foreground">{t('pendingCount', { count: pending })}</p>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<ListTodo />}
              title={t('noTodosYet')}
              description={t('addTodoDesc')}
            />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
