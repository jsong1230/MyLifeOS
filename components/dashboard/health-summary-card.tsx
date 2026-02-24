'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EmptyState } from '@/components/dashboard/empty-state'
import { Heart, ChevronRight, Utensils, Moon } from 'lucide-react'
import type { MealLog, SleepLog } from '@/types/health'

function getToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 건강 모듈 요약 카드 — 오늘 식사 칼로리 + 수면 시간
export function HealthSummaryCard() {
  const today = getToday()

  const { data: meals, isLoading: mealsLoading } = useQuery<MealLog[]>({
    queryKey: ['meals', today],
    queryFn: async () => {
      const res = await fetch(`/api/health/meals?date=${today}`)
      const json = await res.json() as { success: boolean; data: MealLog[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '식사 조회 실패')
      return json.data
    },
  })

  const { data: sleepLogs, isLoading: sleepLoading } = useQuery<SleepLog[]>({
    queryKey: ['sleep', 'today', today],
    queryFn: async () => {
      const res = await fetch(`/api/health/sleep?date=${today}`)
      const json = await res.json() as { success: boolean; data: SleepLog[]; error?: string }
      if (!json.success) throw new Error(json.error ?? '수면 조회 실패')
      return json.data
    },
  })

  const totalCalories = meals?.reduce((s, m) => s + (m.calories ?? 0), 0) ?? 0
  const hasMeals = (meals?.length ?? 0) > 0
  const sleepHours = sleepLogs && sleepLogs.length > 0 ? sleepLogs[0].value : null
  const hasSleep = sleepHours !== null
  const hasData = hasMeals || hasSleep
  const isLoading = mealsLoading || sleepLoading

  return (
    <Link href="/health" className="block">
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">건강 관리</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">불러오는 중...</p>
          ) : hasData ? (
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">오늘</p>
              {hasMeals && (
                <div className="flex items-center gap-1.5">
                  <Utensils className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs">
                    {totalCalories > 0 ? `${totalCalories} kcal` : `식사 ${meals!.length}회`}
                  </span>
                </div>
              )}
              {hasSleep && (
                <div className="flex items-center gap-1.5">
                  <Moon className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs">수면 {sleepHours}시간</span>
                </div>
              )}
            </div>
          ) : (
            <EmptyState
              icon={<Heart />}
              title="건강 기록을 시작해보세요"
              description="식사, 음주, 수면을 기록하고 건강을 관리하세요"
            />
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
