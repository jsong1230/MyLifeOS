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
