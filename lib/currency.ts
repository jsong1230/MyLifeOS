/** 지원하는 통화 코드 */
export type CurrencyCode = 'KRW' | 'CAD' | 'USD'

export const CURRENCY_CODES: CurrencyCode[] = ['KRW', 'CAD', 'USD']

/** 통화별 메타데이터 */
const CURRENCY_META: Record<CurrencyCode, { symbol: string; decimals: number; locale: string }> = {
  KRW: { symbol: '₩', decimals: 0, locale: 'ko-KR' },
  CAD: { symbol: 'CA$', decimals: 2, locale: 'en-CA' },
  USD: { symbol: '$', decimals: 2, locale: 'en-US' },
}

/**
 * 전체 금액 표시: "₩1,234,567" / "$1,234.56" / "CA$1,234.56"
 */
export function formatCurrency(amount: number, currency: CurrencyCode = 'KRW'): string {
  const meta = CURRENCY_META[currency]
  const formatted = Math.abs(amount).toLocaleString(meta.locale, {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  })
  const prefix = amount < 0 ? '-' : ''
  if (currency === 'KRW') {
    return `${prefix}₩${formatted}`
  }
  if (currency === 'CAD') {
    return `${prefix}CA$${formatted}`
  }
  return `${prefix}$${formatted}`
}

/**
 * 숫자만 포맷 (기호 없음): "1,234,567" / "1,234.56"
 */
export function formatAmount(amount: number, currency: CurrencyCode = 'KRW'): string {
  const meta = CURRENCY_META[currency]
  return amount.toLocaleString(meta.locale, {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  })
}

/**
 * 차트용 축약 표시 (locale 인식)
 * - KRW + ko: "1.2억" / "345만" / "1,234"
 * - KRW + en: "120M" / "34.5K" / "1,234"
 * - USD/CAD: "1.2M" / "345K" / "1,234"
 */
export function formatCurrencyCompact(
  amount: number,
  currency: CurrencyCode = 'KRW',
  locale: string = 'ko'
): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''

  if (currency === 'KRW') {
    if (locale === 'ko') {
      if (abs >= 100_000_000) {
        return `${sign}${(abs / 100_000_000).toFixed(1)}억`
      }
      if (abs >= 10_000) {
        return `${sign}${Math.round(abs / 10_000).toLocaleString('ko-KR')}만`
      }
      return `${sign}${abs.toLocaleString('ko-KR')}`
    }
    // KRW + en
    if (abs >= 1_000_000) {
      return `${sign}${(abs / 1_000_000).toFixed(1)}M`
    }
    if (abs >= 1_000) {
      return `${sign}${(abs / 1_000).toFixed(1)}K`
    }
    return `${sign}${abs.toLocaleString('en-US')}`
  }

  // USD / CAD
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1)}M`
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1)}K`
  }
  return `${sign}${abs.toFixed(CURRENCY_META[currency].decimals)}`
}

/**
 * 입력값 파싱: KRW는 정수, CAD/USD는 소수점 2자리
 */
export function parseAmountInput(value: string, currency: CurrencyCode = 'KRW'): number {
  const cleaned = value.replace(/[^0-9.]/g, '')
  if (!cleaned) return 0
  const num = parseFloat(cleaned)
  if (isNaN(num)) return 0
  if (currency === 'KRW') {
    return Math.round(num)
  }
  return Math.round(num * 100) / 100
}

/**
 * 통화 기호 반환: "₩" / "CA$" / "$"
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
  return CURRENCY_META[currency].symbol
}

/**
 * 통화별 소수점 자리 수: KRW=0, CAD/USD=2
 */
export function getCurrencyDecimals(currency: CurrencyCode): number {
  return CURRENCY_META[currency].decimals
}

/** 거래 타입 (currency 계산용 최소 인터페이스) */
export interface TxForTotals {
  type: 'income' | 'expense'
  amount: number
  currency?: string | null
}

/** 통화별 수입/지출 합계 */
export interface CurrencyTotals {
  income: number
  expense: number
}

/**
 * 거래 목록을 통화별로 분리해 수입/지출 합계 반환
 * 반환 예: { KRW: { income: 6500000, expense: 300000 }, USD: { income: 0, expense: 12.99 } }
 */
export function calcTotalsByCurrency(txs: TxForTotals[]): Record<string, CurrencyTotals> {
  const totals: Record<string, CurrencyTotals> = {}
  for (const tx of txs) {
    const c = tx.currency ?? 'KRW'
    if (!totals[c]) totals[c] = { income: 0, expense: 0 }
    if (tx.type === 'income') totals[c].income += tx.amount
    else totals[c].expense += tx.amount
  }
  return totals
}

import type { ExchangeRates } from '@/types/exchange-rate'

/**
 * 통화 변환 (base=USD 환율 기준)
 * - USD→X: amount * rates[X]
 * - X→USD: amount / rates[X]
 * - X→Y: amount * (rates[Y] / rates[X])
 * - 동일 통화: amount 그대로
 */
export function convertCurrency(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: ExchangeRates
): number {
  if (from === to) return amount
  const fromRate = from === 'USD' ? 1 : rates.rates[from]
  const toRate = to === 'USD' ? 1 : rates.rates[to]
  if (!fromRate || !toRate) return 0
  const inUSD = amount / fromRate
  const converted = inUSD * toRate
  return Math.round(converted * 100) / 100
}

/**
 * 통화별 합계를 기준 통화로 환산하여 단일 합계 반환
 */
export function convertTotalsToCurrency(
  totalsByCurrency: Record<string, CurrencyTotals>,
  targetCurrency: CurrencyCode,
  rates: ExchangeRates
): CurrencyTotals {
  let income = 0
  let expense = 0
  for (const [currency, totals] of Object.entries(totalsByCurrency)) {
    income += convertCurrency(totals.income, currency as CurrencyCode, targetCurrency, rates)
    expense += convertCurrency(totals.expense, currency as CurrencyCode, targetCurrency, rates)
  }
  return { income, expense }
}
