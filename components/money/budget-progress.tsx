'use client'

import { cn } from '@/lib/utils'
import type { BudgetStatus } from '@/types/budget'

interface BudgetProgressProps {
  budget: BudgetStatus
}

/**
 * 예산 항목 진행도 컴포넌트
 * - 카테고리명 + 아이콘 | 지출액/예산액 | 퍼센트 표시
 * - Progress 바 색상: 0-80% 파랑, 80-100% 주황, 100%+ 빨강 (AC-03)
 */
export function BudgetProgress({ budget }: BudgetProgressProps) {
  const { category, amount, spent, remaining, percentage } = budget

  // 퍼센트를 바 너비로 클램프 (초과분은 100%로 표시)
  const clampedPercentage = Math.min(percentage, 100)

  // 경고 단계 판별
  const isWarning = percentage >= 80 && percentage < 100
  const isDanger = percentage >= 100

  // 금액 포맷 (원화)
  function formatKRW(value: number): string {
    return new Intl.NumberFormat('ko-KR').format(Math.round(value))
  }

  return (
    <div className="space-y-2">
      {/* 헤더: 카테고리명 + 금액 정보 */}
      <div className="flex items-center justify-between gap-2">
        {/* 카테고리 아이콘 + 이름 */}
        <div className="flex items-center gap-2 min-w-0">
          {category?.icon && (
            <span className="text-base shrink-0" aria-hidden="true">
              {category.icon}
            </span>
          )}
          <span className="text-sm font-medium truncate">
            {category?.name ?? '미분류'}
          </span>
        </div>

        {/* 지출액 / 예산액 */}
        <div className="flex items-center gap-1.5 shrink-0 text-sm">
          <span
            className={cn(
              'font-semibold',
              isDanger && 'text-destructive',
              isWarning && 'text-orange-500'
            )}
          >
            {formatKRW(spent)}원
          </span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">{formatKRW(amount)}원</span>
        </div>
      </div>

      {/* 진행도 바 + 퍼센트 */}
      <div className="flex items-center gap-2">
        {/* 커스텀 Progress 바 (Radix Progress 대신 div로 직접 구현하여 색상 제어) */}
        <div
          className={cn(
            'relative h-2 flex-1 overflow-hidden rounded-full',
            isDanger ? 'bg-destructive/20' : isWarning ? 'bg-orange-500/20' : 'bg-primary/20'
          )}
          role="progressbar"
          aria-valuenow={clampedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`예산 소진율 ${percentage}%`}
        >
          <div
            className={cn(
              'h-full transition-all',
              isDanger ? 'bg-destructive' : isWarning ? 'bg-orange-500' : 'bg-primary'
            )}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>
        <span
          className={cn(
            'text-xs font-medium w-10 text-right',
            isDanger && 'text-destructive',
            isWarning && 'text-orange-500',
            !isDanger && !isWarning && 'text-muted-foreground'
          )}
        >
          {percentage}%
        </span>
      </div>

      {/* 잔여 예산 / 초과 안내 */}
      <p
        className={cn(
          'text-xs',
          isDanger ? 'text-destructive' : 'text-muted-foreground'
        )}
      >
        {isDanger
          ? `${formatKRW(Math.abs(remaining))}원 초과`
          : `${formatKRW(remaining)}원 남음`}
      </p>
    </div>
  )
}
