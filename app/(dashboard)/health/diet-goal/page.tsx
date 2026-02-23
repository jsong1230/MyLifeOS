'use client'

import { useRouter } from 'next/navigation'
import { DietGoalForm } from '@/components/health/diet-goal-form'
import { useDietGoal, useUpsertDietGoal } from '@/hooks/use-diet-goal'
import type { UpsertDietGoalInput } from '@/types/diet-goal'

// 식단 목표 설정 페이지
export default function DietGoalPage() {
  const router = useRouter()
  const { data: goal, isLoading } = useDietGoal()
  const upsertGoal = useUpsertDietGoal()

  // 목표 저장 후 건강 대시보드로 이동
  function handleSubmit(data: UpsertDietGoalInput) {
    upsertGoal.mutate(data, {
      onSuccess: () => {
        router.push('/health')
      },
    })
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto space-y-6">
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-xl font-semibold">식단 목표 설정</h1>
        <p className="text-sm text-muted-foreground mt-1">
          일일 칼로리 및 영양소 목표를 설정합니다
        </p>
      </div>

      {/* 로딩 중 스켈레톤 */}
      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-10 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <DietGoalForm
          goal={goal}
          onSubmit={handleSubmit}
          isLoading={upsertGoal.isPending}
        />
      )}

      {/* 저장 실패 에러 메시지 */}
      {upsertGoal.isError && (
        <p className="text-sm text-destructive" role="alert">
          {upsertGoal.error?.message ?? '목표 저장에 실패했습니다'}
        </p>
      )}
    </div>
  )
}
