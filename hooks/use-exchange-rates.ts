import { useQuery } from '@tanstack/react-query'
import type { ExchangeRates, ExchangeRatesResponse } from '@/types/exchange-rate'

/** /api/exchange-rates 에서 환율 데이터를 조회하는 훅 (staleTime 10분) */
export function useExchangeRates(enabled = true) {
  return useQuery<ExchangeRates>({
    queryKey: ['exchange-rates'],
    queryFn: async () => {
      const res = await fetch('/api/exchange-rates')
      const json = await res.json() as ExchangeRatesResponse
      if (!json.success || !json.data) throw new Error('환율 조회 실패')
      return json.data
    },
    staleTime: 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: false,
    enabled,
  })
}
