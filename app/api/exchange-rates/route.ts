import { NextResponse } from 'next/server'
import type { ExchangeRates, ExchangeRatesResponse } from '@/types/exchange-rate'

export const revalidate = 3600 // 1시간 캐싱

/** frankfurter.app 장애 시 사용할 폴백 환율 */
const FALLBACK_RATES: ExchangeRates = {
  base: 'USD',
  date: '1970-01-01',
  rates: { KRW: 1350, CAD: 1.36 },
  stale: true,
}

/** GET /api/exchange-rates — frankfurter.app 프록시 (1시간 ISR 캐싱) */
export async function GET(): Promise<NextResponse<ExchangeRatesResponse>> {
  try {
    const res = await fetch(
      'https://api.frankfurter.app/latest?from=USD&to=KRW,CAD',
      { next: { revalidate: 3600 } }
    )
    if (!res.ok) {
      return NextResponse.json({ success: true, data: FALLBACK_RATES })
    }
    const raw = await res.json() as { base: string; date: string; rates: Record<string, number> }
    return NextResponse.json({
      success: true,
      data: { base: raw.base, date: raw.date, rates: raw.rates },
    })
  } catch {
    return NextResponse.json({ success: true, data: FALLBACK_RATES })
  }
}
