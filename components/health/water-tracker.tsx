'use client'

import { useTranslations } from 'next-intl'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useWater, useAddWater, useDeleteWater } from '@/hooks/use-water'
import type { WaterLog } from '@/types/health'

// 일일 수분 목표 (ml)
const DAILY_GOAL_ML = 2000

// 빠른 추가 버튼 목록
const QUICK_ADD_OPTIONS = [200, 300, 500] as const

// 스켈레톤 — 로딩 중 표시
function WaterSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      {/* 진행률 바 */}
      <div className="h-6 bg-muted rounded-full" />
      {/* 버튼들 */}
      <div className="flex gap-2">
        {QUICK_ADD_OPTIONS.map((ml) => (
          <div key={ml} className="h-10 flex-1 bg-muted rounded-md" />
        ))}
      </div>
      {/* 기록 목록 */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 bg-muted rounded-md" />
        ))}
      </div>
    </div>
  )
}

// 개별 수분 기록 행
function WaterLogRow({ log, onDelete }: { log: WaterLog; onDelete: (id: string) => void }) {
  const t = useTranslations('health.water')

  // created_at에서 시각 추출 (HH:MM)
  const timeLabel = new Date(log.created_at).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50">
      <div className="flex items-center gap-2">
        <span className="text-base">💧</span>
        <span className="font-medium text-sm">
          {log.amount_ml}
          <span className="text-muted-foreground ml-0.5">{t('ml')}</span>
        </span>
        <span className="text-xs text-muted-foreground">{timeLabel}</span>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(log.id)}
        aria-label={`${log.amount_ml}ml 기록 삭제`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

interface WaterTrackerProps {
  date: string
}

// 수분 섭취 트래커 메인 컴포넌트
export function WaterTracker({ date }: WaterTrackerProps) {
  const t = useTranslations('health.water')
  const waterQuery = useWater(date)
  const addWater = useAddWater()
  const deleteWater = useDeleteWater()

  const logs = waterQuery.data?.data ?? []
  const totalMl = waterQuery.data?.total_ml ?? 0
  const progressPct = Math.min(100, Math.round((totalMl / DAILY_GOAL_ML) * 100))
  const goalReached = totalMl >= DAILY_GOAL_ML

  // 빠른 추가 핸들러
  const handleQuickAdd = (ml: number) => {
    addWater.mutate({ amount_ml: ml, date })
  }

  // 삭제 핸들러
  const handleDelete = (id: string) => {
    deleteWater.mutate(id)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-lg">💧</span>
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {waterQuery.isLoading ? (
          <WaterSkeleton />
        ) : (
          <>
            {/* 오늘 섭취량 + 목표 표시 */}
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <div className="flex items-baseline gap-1">
                  <span className={cn('text-3xl font-bold', goalReached && 'text-blue-500')}>
                    {totalMl.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    / {DAILY_GOAL_ML.toLocaleString()}{t('ml')}
                  </span>
                </div>
                {goalReached && (
                  <span className="text-sm font-medium text-blue-500">
                    {t('goal_reached')}
                  </span>
                )}
              </div>

              {/* 진행률 바 */}
              <div
                className="h-4 w-full bg-muted rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={totalMl}
                aria-valuemax={DAILY_GOAL_ML}
                aria-label={`${t('total_today')}: ${totalMl}ml / ${DAILY_GOAL_ML}ml`}
              >
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    goalReached ? 'bg-blue-500' : 'bg-blue-400'
                  )}
                  style={{ width: `${progressPct}%` }}
                />
              </div>

              <p className="text-xs text-muted-foreground text-right">
                {progressPct}% {t('daily_goal')}: {DAILY_GOAL_ML.toLocaleString()}{t('ml')}
              </p>
            </div>

            {/* 빠른 추가 버튼 */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{t('quick_add')}</p>
              <div className="flex gap-2">
                {QUICK_ADD_OPTIONS.map((ml) => (
                  <Button
                    key={ml}
                    variant="outline"
                    className="flex-1 text-sm font-medium"
                    onClick={() => handleQuickAdd(ml)}
                    disabled={addWater.isPending}
                  >
                    +{ml}{t('ml')}
                  </Button>
                ))}
              </div>
            </div>

            {/* 오늘 기록 목록 */}
            {logs.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">
                  {t('total_today')} ({logs.length}회)
                </p>
                <div className="space-y-1">
                  {logs.map((log) => (
                    <WaterLogRow
                      key={log.id}
                      log={log}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t('no_records')}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
