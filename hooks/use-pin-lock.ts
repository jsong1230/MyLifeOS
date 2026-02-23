'use client'

import { useEffect } from 'react'
import { usePinStore } from '@/store/pin.store'

/** 백그라운드 복귀 후 PIN 재인증을 요구하는 임계값 (30초) */
const PIN_REENTRY_THRESHOLD_MS = 30 * 1000

const SESSION_KEY_LAST_HIDDEN_AT = 'pin_last_hidden_at'

/**
 * 앱이 백그라운드로 전환될 때 타임스탬프를 기록하고,
 * 복귀 시 30초 초과면 PIN 인증 상태를 초기화한다.
 */
export function usePinLock(): void {
  const resetPinVerification = usePinStore((s) => s.resetPinVerification)

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        // 백그라운드 전환: 현재 시각 기록
        sessionStorage.setItem(SESSION_KEY_LAST_HIDDEN_AT, Date.now().toString())
      } else {
        // 포그라운드 복귀: 경과 시간 확인
        const raw = sessionStorage.getItem(SESSION_KEY_LAST_HIDDEN_AT)
        if (raw !== null) {
          const elapsed = Date.now() - Number(raw)
          if (elapsed > PIN_REENTRY_THRESHOLD_MS) {
            resetPinVerification()
          }
          sessionStorage.removeItem(SESSION_KEY_LAST_HIDDEN_AT)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [resetPinVerification])
}
