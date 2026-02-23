/**
 * F-01: useInactivityTimeout 훅 단위 테스트
 * 테스트 대상: hooks/use-inactivity-timeout.ts (아직 구현 없음 → FAIL 예상)
 * 커버 범위: U-16 ~ U-22, B-10 ~ B-11
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ─────────────────────────────────────────────
// 의존성 Mock 설정
// ─────────────────────────────────────────────
const mockSignOut = vi.fn().mockResolvedValue({})
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signOut: mockSignOut,
    },
  }),
}))

const mockReset = vi.fn()
vi.mock('@/store/auth.store', () => ({
  useAuthStore: {
    getState: () => ({ reset: mockReset }),
  },
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ─────────────────────────────────────────────
// 테스트 시작
// ─────────────────────────────────────────────
describe('useInactivityTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockPush.mockClear()
    mockSignOut.mockClear()
    mockReset.mockClear()
    // 모듈 캐시를 초기화하여 매 테스트마다 신선한 import 보장
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // U-16: 30분 타이머 시작
  it('훅이 마운트되면 30분(1800000ms) 타이머를 설정한다', async () => {
    const { useInactivityTimeout } = await import('@/hooks/use-inactivity-timeout')
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    renderHook(() => useInactivityTimeout())

    // 30분 타이머가 설정되었는지 확인
    const calledWithTimeout = setTimeoutSpy.mock.calls.some(
      (call) => call[1] === 1800000
    )
    expect(calledWithTimeout).toBe(true)
  })

  // U-18: 타이머 만료 시 로그아웃 (B-10: 정확히 30분)
  it('30분(1800000ms) 후 signOut을 호출한다', async () => {
    const { useInactivityTimeout } = await import('@/hooks/use-inactivity-timeout')
    renderHook(() => useInactivityTimeout())

    await act(async () => {
      vi.advanceTimersByTime(1800000)
    })

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('30분 후 useAuthStore.reset()을 호출한다', async () => {
    const { useInactivityTimeout } = await import('@/hooks/use-inactivity-timeout')
    renderHook(() => useInactivityTimeout())

    await act(async () => {
      vi.advanceTimersByTime(1800000)
    })

    expect(mockReset).toHaveBeenCalledTimes(1)
  })

  it('30분 후 /login?reason=inactivity로 리다이렉트한다', async () => {
    const { useInactivityTimeout } = await import('@/hooks/use-inactivity-timeout')
    renderHook(() => useInactivityTimeout())

    await act(async () => {
      vi.advanceTimersByTime(1800000)
    })

    expect(mockPush).toHaveBeenCalledWith('/login?reason=inactivity')
  })

  // U-17: mousemove 이벤트 시 타이머 리셋 (B-11: 29분 59초 후 이벤트)
  it('mousemove 이벤트 발생 시 타이머가 리셋된다', async () => {
    const { useInactivityTimeout } = await import('@/hooks/use-inactivity-timeout')
    renderHook(() => useInactivityTimeout())

    // 20분 경과
    await act(async () => {
      vi.advanceTimersByTime(1200000)
    })

    // 마우스 이동 이벤트 → 타이머 리셋
    await act(async () => {
      window.dispatchEvent(new MouseEvent('mousemove'))
    })

    // 추가 20분 경과 (리셋 후 20분 = 총 40분 경과지만 리셋 기준 20분)
    await act(async () => {
      vi.advanceTimersByTime(1200000)
    })

    // 타이머 리셋 후 30분이 지나지 않았으므로 리다이렉트 안 됨
    expect(mockPush).not.toHaveBeenCalled()
  })

  // U-19: 여러 이벤트 타입 감지
  it('keydown 이벤트 발생 시 타이머가 리셋된다', async () => {
    const { useInactivityTimeout } = await import('@/hooks/use-inactivity-timeout')
    renderHook(() => useInactivityTimeout())

    await act(async () => {
      vi.advanceTimersByTime(1500000) // 25분
    })

    await act(async () => {
      window.dispatchEvent(new KeyboardEvent('keydown'))
    })

    await act(async () => {
      vi.advanceTimersByTime(1500000) // 추가 25분 (리셋 후)
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('click 이벤트 발생 시 타이머가 리셋된다', async () => {
    const { useInactivityTimeout } = await import('@/hooks/use-inactivity-timeout')
    renderHook(() => useInactivityTimeout())

    await act(async () => {
      vi.advanceTimersByTime(1500000) // 25분
    })

    await act(async () => {
      window.dispatchEvent(new MouseEvent('click'))
    })

    await act(async () => {
      vi.advanceTimersByTime(1500000) // 추가 25분 (리셋 후)
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('touchstart 이벤트 발생 시 타이머가 리셋된다', async () => {
    const { useInactivityTimeout } = await import('@/hooks/use-inactivity-timeout')
    renderHook(() => useInactivityTimeout())

    await act(async () => {
      vi.advanceTimersByTime(1500000) // 25분
    })

    await act(async () => {
      window.dispatchEvent(new TouchEvent('touchstart'))
    })

    await act(async () => {
      vi.advanceTimersByTime(1500000) // 추가 25분 (리셋 후)
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('scroll 이벤트 발생 시 타이머가 리셋된다', async () => {
    const { useInactivityTimeout } = await import('@/hooks/use-inactivity-timeout')
    renderHook(() => useInactivityTimeout())

    await act(async () => {
      vi.advanceTimersByTime(1500000) // 25분
    })

    await act(async () => {
      window.dispatchEvent(new Event('scroll'))
    })

    await act(async () => {
      vi.advanceTimersByTime(1500000) // 추가 25분 (리셋 후)
    })

    expect(mockPush).not.toHaveBeenCalled()
  })

  // U-20: 언마운트 시 정리
  it('훅 언마운트 시 이벤트 리스너와 타이머가 정리된다', async () => {
    const { useInactivityTimeout } = await import('@/hooks/use-inactivity-timeout')
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useInactivityTimeout())
    unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    expect(removeEventListenerSpy).toHaveBeenCalled()
  })

  // U-21: throttle 동작 - 100ms 간격으로 10번 mousemove 시 타이머 리셋 횟수 제한
  it('100ms 간격으로 여러 번 mousemove 발생 시 throttle로 타이머 리셋이 제한된다', async () => {
    const { useInactivityTimeout } = await import('@/hooks/use-inactivity-timeout')
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

    renderHook(() => useInactivityTimeout())

    // 초기 타이머 설정 호출 횟수 기록
    const initialClearCalls = clearTimeoutSpy.mock.calls.length

    // 100ms 간격으로 10번 mousemove (총 1초)
    for (let i = 0; i < 10; i++) {
      await act(async () => {
        window.dispatchEvent(new MouseEvent('mousemove'))
        vi.advanceTimersByTime(100)
      })
    }

    // throttle이 적용되어 clearTimeout 호출이 10번보다 적어야 함 (1초 throttle)
    const totalClearCalls = clearTimeoutSpy.mock.calls.length - initialClearCalls
    expect(totalClearCalls).toBeLessThan(10)
  })

  // U-22: 커스텀 타임아웃
  it('timeoutMs=60000 (1분) 옵션으로 1분 후 로그아웃이 발생한다', async () => {
    const { useInactivityTimeout } = await import('@/hooks/use-inactivity-timeout')
    renderHook(() => useInactivityTimeout(60000))

    // 59초 경과 - 로그아웃 안 됨
    await act(async () => {
      vi.advanceTimersByTime(59000)
    })
    expect(mockPush).not.toHaveBeenCalled()

    // 1분 경과 - 로그아웃 됨
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })
    expect(mockPush).toHaveBeenCalledWith('/login?reason=inactivity')
  })
})
