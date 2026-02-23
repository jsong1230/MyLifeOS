'use client'

import { EMOTION_ICONS, EMOTION_LABELS, type EmotionType } from '@/types/diary'
import type { WeeklyReport } from '@/types/report'

interface WeeklyReportProps {
  report: WeeklyReport
}

// 금액 한국어 포맷 (예: 1,234,567원)
function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

// 원형 진행바 CSS 구현 (SVG 기반)
function CircularProgress({ rate }: { rate: number }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  // rate 0~100 → strokeDashoffset 계산
  const offset = circumference - (rate / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width="96"
        height="96"
        viewBox="0 0 96 96"
        aria-label={`완료율 ${rate}%`}
        role="img"
      >
        {/* 배경 원 */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted/30"
        />
        {/* 진행 원 */}
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-primary transition-all duration-500"
          transform="rotate(-90 48 48)"
        />
      </svg>
      {/* 중앙 텍스트 */}
      <span className="absolute text-lg font-bold">{rate}%</span>
    </div>
  )
}

// 주간 리포트 컴포넌트
export function WeeklyReportView({ report }: WeeklyReportProps) {
  const { todos, spending, health, emotions } = report

  // 감정 분포: 횟수 내림차순 정렬
  const sortedEmotions = Object.entries(emotions).sort(([, a], [, b]) => b - a)

  // 주간 종료일 계산 (주 시작 + 6일)
  const weekEndDate = new Date(report.week_start)
  weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6)
  const weekEnd = weekEndDate.toISOString().split('T')[0]

  return (
    <div className="space-y-5">
      {/* 기간 표시 */}
      <p className="text-sm text-muted-foreground text-center">
        {report.week_start} ~ {weekEnd}
      </p>

      {/* ── 할일 완료율 ── */}
      <section aria-labelledby="weekly-todos-heading">
        <h3
          id="weekly-todos-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          할일 완료율
        </h3>
        <div className="bg-card border rounded-xl p-4 flex items-center gap-6">
          <CircularProgress rate={todos.rate} />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              전체 <span className="font-semibold text-foreground">{todos.total}개</span>
            </p>
            <p className="text-sm text-muted-foreground">
              완료 <span className="font-semibold text-primary">{todos.completed}개</span>
            </p>
          </div>
        </div>
      </section>

      {/* ── 수입/지출 요약 ── */}
      <section aria-labelledby="weekly-spending-heading">
        <h3
          id="weekly-spending-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          수입 / 지출
        </h3>
        <div className="bg-card border rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">수입</p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              +{formatKRW(spending.income)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">지출</p>
            <p className="text-base font-bold text-red-500">
              -{formatKRW(spending.expense)}
            </p>
          </div>
        </div>
      </section>

      {/* ── 건강 지표 ── */}
      <section aria-labelledby="weekly-health-heading">
        <h3
          id="weekly-health-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          건강 지표
        </h3>
        <div className="bg-card border rounded-xl p-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1">평균 수면</p>
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
      <section aria-labelledby="weekly-emotions-heading">
        <h3
          id="weekly-emotions-heading"
          className="text-sm font-semibold text-muted-foreground mb-3"
        >
          감정 분포
        </h3>
        {sortedEmotions.length === 0 ? (
          <div className="bg-card border rounded-xl p-4 text-center text-sm text-muted-foreground">
            이번 주 일기 기록이 없습니다
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
