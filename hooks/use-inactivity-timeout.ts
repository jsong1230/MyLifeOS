'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth.store'
import { usePinStore } from '@/store/pin.store'

// 비활동 감지 대상 이벤트 목록
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'touchstart', 'click', 'scroll'] as const

/**
 * 30분 비활동 시 자동 로그아웃 훅
 * app/(dashboard)/layout.tsx 에서 한 번만 마운트
 */
export function useInactivityTimeout(timeoutMs: number = 30 * 60 * 1000): void {
  const router = useRouter()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const throttleRef = useRef<boolean>(false)

  useEffect(() => {
    const supabase = createClient()

    // 타이머 만료 시 로그아웃 처리
    async function handleTimeout() {
      await supabase.auth.signOut()
      useAuthStore.getState().reset()
      usePinStore.getState().resetPinVerification()
      router.push('/login?reason=inactivity')
    }

    // 타이머 재시작
    function resetTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(handleTimeout, timeoutMs)
    }

    // 1초 throttle 적용 — 과도한 타이머 리셋 방지
    function handleActivity() {
      if (throttleRef.current) return
      throttleRef.current = true
      setTimeout(() => { throttleRef.current = false }, 1000)
      resetTimer()
    }

    // 이벤트 리스너 등록 (passive: true로 스크롤 성능 보호)
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    // 초기 타이머 시작
    resetTimer()

    // 언마운트 시 이벤트 리스너 및 타이머 정리
    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [router, timeoutMs])
}
