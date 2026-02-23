'use client'

import { cn } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// WHO 기준 주간 권장 음주 횟수 (단위: 잔)
// 남성: 14잔/주, 여성: 7잔/주 — 성별 미구분으로 보수적 기준(7잔) 사용 시 경고 표시
// 단, 경고는 데이터 있을 때만 표시하는 옵션 사항
const WHO_WEEKLY_LIMIT_DRINKS = 14 // 남성 기준

interface DrinkSummary {
  count: number       // 음주 일수
  total_ml: number    // 총 섭취량 (ml)
}

interface DrinkWeeklyCardProps {
  summary: DrinkSummary
  weekLabel: string
  // drink_count 총합 (잔 수 기준 경고에 사용) — 옵션
  totalDrinkCount?: number
}

// ml을 L로 변환하여 보기 좋게 표시
function formatVolume(ml: number): string {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)}L`
  }
  return `${ml}ml`
}

// 이번 주 음주 현황 카드
export function DrinkWeeklyCard({ summary, weekLabel, totalDrinkCount }: DrinkWeeklyCardProps) {
  const hasNoDrinks = summary.count === 0

  // WHO 기준 초과 여부 — 잔 수 데이터가 있을 때만 판단
  const isOverWhoLimit =
    totalDrinkCount !== undefined && totalDrinkCount > WHO_WEEKLY_LIMIT_DRINKS

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {/* 음주 아이콘 */}
          <span className="text-lg">🍺</span>
          이번 주 음주
        </CardTitle>
        <CardDescription>{weekLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasNoDrinks ? (
          // 음주 없음 상태 — 초록 배지
          <div className="flex items-center gap-3 py-2">
            <Badge
              className={cn(
                'border-transparent bg-green-100 text-green-700',
                'dark:bg-green-900/30 dark:text-green-400'
              )}
            >
              이번주 음주 없음
            </Badge>
          </div>
        ) : (
          <>
            {/* 주요 통계 */}
            <div className="grid grid-cols-2 gap-4">
              {/* 음주 횟수 */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">음주 횟수</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{summary.count}</span>
                  <span className="text-sm text-muted-foreground">회</span>
                </div>
              </div>

              {/* 총 섭취량 */}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">총 섭취량</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">
                    {formatVolume(summary.total_ml)}
                  </span>
                </div>
              </div>
            </div>

            {/* WHO 기준 경고 — 잔 수 데이터 있을 때만 표시 */}
            {totalDrinkCount !== undefined && (
              <div className="flex items-center gap-2">
                {isOverWhoLimit ? (
                  <Badge
                    className={cn(
                      'border-transparent bg-orange-100 text-orange-700',
                      'dark:bg-orange-900/30 dark:text-orange-400'
                    )}
                  >
                    WHO 권장량 초과 ({totalDrinkCount}잔 / 주 {WHO_WEEKLY_LIMIT_DRINKS}잔 기준)
                  </Badge>
                ) : (
                  <Badge
                    className={cn(
                      'border-transparent bg-green-100 text-green-700',
                      'dark:bg-green-900/30 dark:text-green-400'
                    )}
                  >
                    권장량 이내 ({totalDrinkCount}잔)
                  </Badge>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
