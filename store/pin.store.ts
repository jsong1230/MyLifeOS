'use client'

import { create } from 'zustand'

/** sessionStorage 키 상수 */
export const SESSION_KEYS = {
  PIN_VERIFIED: 'pin_verified',
  ENCRYPTION_KEY: 'pin_encryption_key',
  FAILED_ATTEMPTS: 'pin_failed_attempts',
  LOCKED_UNTIL: 'pin_locked_until',
  LAST_HIDDEN_AT: 'pin_last_hidden_at',
} as const

interface PinState {
  /** PIN 설정 여부 (서버 조회 결과) */
  isPinSet: boolean
  /** 현재 세션에서 PIN 인증 완료 여부 */
  isPinVerified: boolean
  /** 연속 실패 횟수 */
  failedAttempts: number
  /** 잠금 해제 시각 (Unix ms), null이면 잠금 없음 */
  lockedUntil: number | null
  /** PBKDF2 파생 암호화 키 (메모리 + sessionStorage) */
  encryptionKey: string | null
  /** API 호출 중 로딩 상태 (메모리 전용) */
  isLoading: boolean
}

interface PinActions {
  setIsPinSet: (value: boolean) => void
  setPinVerified: (verified: boolean, key: string | null) => void
  setFailedAttempts: (count: number) => void
  setLockedUntil: (until: number | null) => void
  setLoading: (loading: boolean) => void
  resetPinVerification: () => void
  resetLockState: () => void
  /** 잠금 상태 여부 */
  isLocked: () => boolean
  /** 잠금 해제까지 남은 초 (잠금 없으면 0) */
  getRemainingLockSeconds: () => number
}

type PinStore = PinState & PinActions

/** sessionStorage에서 초기 상태 로드 */
function loadFromSession(): Partial<PinState> {
  if (typeof window === 'undefined') return {}
  try {
    return {
      isPinVerified: sessionStorage.getItem(SESSION_KEYS.PIN_VERIFIED) === 'true',
      encryptionKey: sessionStorage.getItem(SESSION_KEYS.ENCRYPTION_KEY),
      failedAttempts: Number(sessionStorage.getItem(SESSION_KEYS.FAILED_ATTEMPTS) ?? '0'),
      lockedUntil: sessionStorage.getItem(SESSION_KEYS.LOCKED_UNTIL)
        ? Number(sessionStorage.getItem(SESSION_KEYS.LOCKED_UNTIL))
        : null,
    }
  } catch {
    return {}
  }
}

export const usePinStore = create<PinStore>((set, get) => ({
  // 초기 상태
  isPinSet: false,
  isPinVerified: false,
  failedAttempts: 0,
  lockedUntil: null,
  encryptionKey: null,
  isLoading: false,
  ...loadFromSession(),

  // 액션
  setIsPinSet: (value) => set({ isPinSet: value }),

  setPinVerified: (verified, key) => {
    set({ isPinVerified: verified, encryptionKey: key })
    try {
      sessionStorage.setItem(SESSION_KEYS.PIN_VERIFIED, String(verified))
      if (key !== null) {
        sessionStorage.setItem(SESSION_KEYS.ENCRYPTION_KEY, key)
      } else {
        sessionStorage.removeItem(SESSION_KEYS.ENCRYPTION_KEY)
      }
    } catch { /* sessionStorage 접근 불가 환경 무시 */ }
  },

  setFailedAttempts: (count) => {
    set({ failedAttempts: count })
    try {
      sessionStorage.setItem(SESSION_KEYS.FAILED_ATTEMPTS, String(count))
    } catch { /* 무시 */ }
  },

  setLockedUntil: (until) => {
    set({ lockedUntil: until })
    try {
      if (until !== null) {
        sessionStorage.setItem(SESSION_KEYS.LOCKED_UNTIL, String(until))
      } else {
        sessionStorage.removeItem(SESSION_KEYS.LOCKED_UNTIL)
      }
    } catch { /* 무시 */ }
  },

  setLoading: (loading) => set({ isLoading: loading }),

  resetPinVerification: () => {
    set({ isPinVerified: false, encryptionKey: null })
    try {
      sessionStorage.setItem(SESSION_KEYS.PIN_VERIFIED, 'false')
      sessionStorage.removeItem(SESSION_KEYS.ENCRYPTION_KEY)
    } catch { /* 무시 */ }
  },

  resetLockState: () => {
    set({ failedAttempts: 0, lockedUntil: null })
    try {
      sessionStorage.setItem(SESSION_KEYS.FAILED_ATTEMPTS, '0')
      sessionStorage.removeItem(SESSION_KEYS.LOCKED_UNTIL)
    } catch { /* 무시 */ }
  },

  isLocked: () => {
    const { lockedUntil } = get()
    return lockedUntil !== null && lockedUntil > Date.now()
  },

  getRemainingLockSeconds: () => {
    const { lockedUntil } = get()
    if (lockedUntil === null || lockedUntil <= Date.now()) return 0
    return Math.ceil((lockedUntil - Date.now()) / 1000)
  },
}))
