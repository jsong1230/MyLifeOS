'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Clock, ListTodo, ChevronRight } from 'lucide-react'
import type { Todo } from '@/types/todo'

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 시간 모듈 요약 카드 — 오늘 할일 현황
export function TimeSummaryCard() {
  const today = getToday()

  const { data: todos, isLoading } = useQuery<Todo[]>({
    queryKey: ['todos', 'today', today],
    queryFn: async () => {
      const res = await fetch(`/api/todos?date=${today}`)
      const json = await res.json() as { success: boolean; data: Todo[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '할일 조회 실패')
      return json.data
    },
  })

  const total = todos?.length ?? 0
  const completed = todos?.filter((t) => t.status === 'completed').length ?? 0
  const pending = total - completed

  return (
    <Link href="/time" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">시간 관리</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">불러오는 중...</p>
          ) : total > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">오늘 할일</span>
                <span className="text-xs font-medium">{completed}/{total} 완료</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.round((completed / total) * 100)}%` }}
                />
              </div>
              {pending > 0 && (
                <p className="text-xs text-muted-foreground">남은 할일 {pending}개</p>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<ListTodo />}
              title="할일이 아직 없어요"
              description="할일을 추가하고 하루를 관리해보세요"
            />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
