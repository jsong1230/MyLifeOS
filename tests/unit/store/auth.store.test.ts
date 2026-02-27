/**
 * F-01: useAuthStore 단위 테스트
 * 테스트 대상: store/auth.store.ts
 * 커버 범위: U-23 ~ U-27
 *
 * 현재 구현에서 isLoading, setLoading이 없으므로 일부 테스트는 FAIL 예상
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useAuthStore } from '@/store/auth.store'

describe('useAuthStore', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.getState().reset()
    })
  })

  // U-23: 초기 상태 확인
  it('초기 상태에 user가 null이다', () => {
    const state = useAuthStore.getState()
    expect(state.user).toBeNull()
  })

  it('isLoading 프로퍼티가 존재한다', () => {
    const state = useAuthStore.getState()
    expect(state).toHaveProperty('isLoading')
    expect(typeof state.isLoading).toBe('boolean')
  })

  // U-24: setUser 동작
  it('setUser로 user를 설정할 수 있다', () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' } as any
    act(() => {
      useAuthStore.getState().setUser(mockUser)
    })
    expect(useAuthStore.getState().user).toEqual(mockUser)
  })

  // U-27: setUser(null)
  it('setUser(null)로 user를 초기화할 수 있다', () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' } as any
    act(() => {
      useAuthStore.getState().setUser(mockUser)
      useAuthStore.getState().setUser(null)
    })
    expect(useAuthStore.getState().user).toBeNull()
  })

  // U-25: setLoading 동작
  it('setLoading(true)으로 isLoading을 true로 변경할 수 있다', () => {
    // store/auth.store.ts에 setLoading이 없으므로 FAIL 예상
    act(() => {
      useAuthStore.getState().setLoading(true)
    })
    expect(useAuthStore.getState().isLoading).toBe(true)
  })

  it('setLoading(false)으로 isLoading을 false로 변경할 수 있다', () => {
    // store/auth.store.ts에 setLoading이 없으므로 FAIL 예상
    act(() => {
      useAuthStore.getState().setLoading(false)
    })
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  // U-26: reset() 동작
  it('reset() 호출 시 isLoading이 false로 초기화된다', () => {
    // store/auth.store.ts에 isLoading이 없으므로 FAIL 예상
    act(() => {
      useAuthStore.getState().setLoading(true)
      useAuthStore.getState().reset()
    })
    expect(useAuthStore.getState().isLoading).toBe(false)
  })

  it('reset() 호출 시 user가 null로 초기화된다', () => {
    const mockUser = { id: 'test-id', email: 'test@example.com' } as any
    act(() => {
      useAuthStore.getState().setUser(mockUser)
      useAuthStore.getState().reset()
    })
    expect(useAuthStore.getState().user).toBeNull()
  })

})
