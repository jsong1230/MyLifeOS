/** 환율 데이터 (frankfurter.app 응답 기반, base=USD) */
export interface ExchangeRates {
  /** 기준 통화 (항상 'USD') */
  base: string
  /** 환율 조회 날짜 (YYYY-MM-DD) */
  date: string
  /** 통화 코드 → 환율 맵 (base 1단위당 값) */
  rates: Record<string, number>
  /** fallback 환율 사용 여부 */
  stale?: boolean
}

/** /api/exchange-rates 응답 형태 */
export interface ExchangeRatesResponse {
  success: boolean
  data?: ExchangeRates
  error?: string
}
