/**
 * hooks/use-exchange-rates.ts 단위 테스트
 * 테스트 대상: useExchangeRates (react-query 훅)
 * 커버 범위: enabled=false 시 fetch 미호출, enabled=true 시 fetch 호출 및 데이터 반환
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useExchangeRates } from '@/hooks/use-exchange-rates'
import type { ExchangeRates } from '@/types/exchange-rate'

// ─────────────────────────────────────────────
// Mock 환율 데이터
// ─────────────────────────────────────────────
const mockRates: ExchangeRates = {
  base: 'USD',
  date: '2024-01-01',
  rates: { KRW: 1350, CAD: 1.36, USD: 1 },
}

// ─────────────────────────────────────────────
// QueryClient wrapper 팩토리
// ─────────────────────────────────────────────
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // 테스트에서 재시도 비활성화
        retry: false,
        gcTime: 0,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

// ─────────────────────────────────────────────
// 테스트 시작
// ─────────────────────────────────────────────
describe('useExchangeRates', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ─── enabled=false 시 fetch 미호출 ───
  it('enabled=false 시 fetch를 호출하지 않는다', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    renderHook(() => useExchangeRates(false), { wrapper: createWrapper() })

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('enabled=false 시 data가 undefined이고 isFetching이 false이다', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: mockRates }), { status: 200 })
    )

    const { result } = renderHook(() => useExchangeRates(false), {
      wrapper: createWrapper(),
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isFetching).toBe(false)
  })

  // ─── enabled=true(기본값) 시 fetch 호출 ───
  it('enabled=true 시 /api/exchange-rates로 fetch를 호출한다', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: mockRates }), { status: 200 })
    )

    renderHook(() => useExchangeRates(true), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/exchange-rates')
    })
  })

  it('enabled 인자 없이 호출하면 기본값(true)으로 fetch를 호출한다', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: mockRates }), { status: 200 })
    )

    renderHook(() => useExchangeRates(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/exchange-rates')
    })
  })

  it('fetch 성공 시 ExchangeRates 데이터를 반환한다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: mockRates }), { status: 200 })
    )

    const { result } = renderHook(() => useExchangeRates(true), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockRates)
    expect(result.current.data?.base).toBe('USD')
    expect(result.current.data?.rates.KRW).toBe(1350)
    expect(result.current.data?.rates.CAD).toBe(1.36)
  })

  it('API 응답의 success=false 시 에러 상태가 된다', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: '환율 조회 실패' }), {
        status: 200,
      })
    )

    const { result } = renderHook(() => useExchangeRates(true), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.data).toBeUndefined()
  })

  it('fetch 자체가 실패하면 에러 상태가 된다', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('네트워크 오류'))

    const { result } = renderHook(() => useExchangeRates(true), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })
  })
})
