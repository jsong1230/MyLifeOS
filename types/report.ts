// ─── 주간 리포트 타입 ─────────────────────────────────────────

export interface WeeklyReport {
  /** 주 시작일 (YYYY-MM-DD, 월요일) */
  week_start: string
  /** 할일 집계 */
  todos: {
    total: number
    completed: number
    /** 완료율 0~100 */
    rate: number
  }
  /** 통화별 수입/지출 집계 */
  spending: {
    byCurrency: Record<string, { income: number; expense: number }>
  }
  /** 건강 집계 */
  health: {
    /** 평균 수면 시간 (소수점 1자리, 단위: 시간) */
    avg_sleep: number
    /** 음주 기록이 있는 날 수 */
    drink_days: number
  }
  /** 감정 분포: 감정 태그별 횟수 */
  emotions: Record<string, number>
}

// ─── 월간 리포트 타입 ─────────────────────────────────────────

export interface MonthlyReport {
  year: number
  month: number
  /** 할일 집계 */
  todos: {
    total: number
    completed: number
    /** 완료율 0~100 */
    rate: number
  }
  /** 통화별 수입/지출 집계 (전월 대비 포함) */
  spending: {
    byCurrency: Record<string, {
      income: number
      expense: number
      /** 전월 지출 합계 */
      prev_expense: number
      /** 전월 대비 증감률 (%) — 전월이 0이면 0 */
      change_pct: number
    }>
  }
  /** 건강 집계 */
  health: {
    /** 월간 평균 수면 시간 */
    avg_sleep: number
    /** 음주 일수 */
    drink_days: number
  }
  /** 감정 분포: 감정 태그별 횟수 */
  emotions: Record<string, number>
}
