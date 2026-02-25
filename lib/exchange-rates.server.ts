import type { ExchangeRates } from '@/types/exchange-rate'
import type { CurrencyCode } from '@/lib/currency'
import { convertCurrency } from '@/lib/currency'

const FALLBACK_RATES: ExchangeRates = {
  base: 'USD',
  date: '1970-01-01',
  rates: { KRW: 1350, CAD: 1.36 },
  stale: true,
}

/** 서버 사이드 환율 조회 (1시간 캐싱) */
export async function fetchExchangeRatesServer(): Promise<ExchangeRates> {
  try {
    const res = await fetch(
      'https://api.frankfurter.app/latest?from=USD&to=KRW,CAD',
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) return FALLBACK_RATES
    const raw = await res.json() as { base: string; date: string; rates: Record<string, number> }
    return { base: raw.base, date: raw.date, rates: raw.rates }
  } catch {
    return FALLBACK_RATES
  }
}

/** 거래 목록을 목표 통화로 환산하여 수입/지출 합산 */
export function sumConverted(
  txs: Array<{ amount: number | string; type: string; currency?: string | null }>,
  targetCurrency: CurrencyCode,
  rates: ExchangeRates
): { income: number; expense: number } {
  let income = 0
  let expense = 0
  for (const tx of txs) {
    const from = (tx.currency ?? 'KRW') as CurrencyCode
    const converted = convertCurrency(Number(tx.amount), from, targetCurrency, rates)
    if (tx.type === 'income') income += converted
    else expense += converted
  }
  return { income, expense }
}
