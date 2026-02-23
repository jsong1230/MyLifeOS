'use client'

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { EMOTION_ICONS, EMOTION_LABELS, type EmotionType } from '@/types/diary'
import type { MonthlyReport } from '@/types/report'

interface MonthlyReportProps {
  report: MonthlyReport
}

// 금액 한국어 포맷
function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

// 할일 완료율 바 컴포넌트 (선형 프로그레스)
function LinearProgress({ rate }: { rate: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">완료율</span>
        <span className="font-semibold text-primary">{rate}%</span>
      </div>
      <div
        className="h-2.5 bg-muted rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={rate}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`할일 완료율 ${rate}%`}
      >
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${rate}%` }}
        />
      </div>
    </div>
  )
}

// 전월 대비 증감 표시 컴포넌트
function SpendingTrend({ changePct }: { changePct: number }) {
  if (changePct === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="w-4 h-4" aria-hidden="true" />
        <span className="text-sm font-medium">전월과 동일</span>
      </div>
    )
  }

  const isUp = changePct > 0
  return (
    <div
      className={`flex items-center gap-1 ${isUp ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}
    >
      {isUp ? (
        <TrendingUp className="w-4 h-4" aria-hidden="true" />
      ) : (
        <TrendingDown className="w-4 h-4" aria-hidden="true" />
      )}
      <span className="text-sm font-semibold">
        {isUp ? '+' : ''}{changePct}%
      </span>
      <span className="text-xs text-muted-foreground">전월 대비</span>
    </div>
  )
}

// 월간 리포트 컴포넌트
export function MonthlyReportView({ report }: MonthlyReportProps) {
  const { todos, spending, health, emotions } = report

  // 감정 분포: 횟수 내림차순 정렬
  const sortedEmotions = Object.entries(emotions).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-5">
      {/* ── 할일 완료율 ── */}
      <section aria-labelledby="monthly-todos-heading">
        <h3
          id="monthly-todos-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          할일 완료율
        </h3>
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <LinearProgress rate={todos.rate} />
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>
              전체 <span className="font-semibold text-foreground">{todos.total}개</span>
            </span>
            <span>
              완료 <span className="font-semibold text-primary">{todos.completed}개</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── 지출 현황 (전월 대비) ── */}
      <section aria-labelledby="monthly-spending-heading">
        <h3
          id="monthly-spending-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          지출 현황
        </h3>
        <div className="bg-card border rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">이번달 지출</p>
              <p className="text-xl font-bold text-red-500">
                {formatKRW(spending.expense)}
              </p>
            </div>
            <SpendingTrend changePct={spending.change_pct} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">수입</p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                +{formatKRW(spending.income)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">전월 지출</p>
              <p className="text-sm font-semibold text-muted-foreground">
                {formatKRW(spending.prev_expense)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 건강 요약 ── */}
      <section aria-labelledby="monthly-health-heading">
        <h3
          id="monthly-health-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          건강 요약
        </h3>
        <div className="bg-card border rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">월간 평균 수면</p>
            <p className="text-base font-bold">
              {health.avg_sleep > 0 ? `${health.avg_sleep}시간` : '기록 없음'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">음주 일수</p>
            <p className="text-base font-bold">{health.drink_days}일</p>
          </div>
        </div>
      </section>

      {/* ── 감정 분포 ── */}
      <section aria-labelledby="monthly-emotions-heading">
        <h3
          id="monthly-emotions-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          감정 분포
        </h3>
        {sortedEmotions.length === 0 ? (
          <div className="bg-card border rounded-xl p-4 text-center text-sm text-muted-foreground">
            이번달 일기 기록이 없습니다
          </div>
        ) : (
          <div className="bg-card border rounded-xl p-4">
            <div className="flex flex-wrap gap-3">
              {sortedEmotions.map(([tag, count]) => {
                const emotionType = tag as EmotionType
                const icon = EMOTION_ICONS[emotionType] ?? '❓'
                const label = EMOTION_LABELS[emotionType] ?? tag
                return (
                  <div
                    key={tag}
                    className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-1.5"
                  >
                    <span aria-hidden="true" className="text-lg">
                      {icon}
                    </span>
                    <span className="text-sm font-medium">{label}</span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
