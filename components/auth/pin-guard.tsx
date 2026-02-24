'use client'

import { useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { usePinStore } from '@/store/pin.store'
import { usePinLock } from '@/hooks/use-pin-lock'
import { deriveKey } from '@/lib/crypto/encryption'
import { PinPad } from '@/components/auth/pin-pad'
import { PinSetup } from '@/components/auth/pin-setup'
import { PinLockScreen } from '@/components/auth/pin-lock-screen'
import type { PinGuardProps } from '@/types/pin'

/**
 * PIN 인증 상태에 따라 적절한 화면을 렌더링하는 보호 래퍼.
 * - PIN 미설정: PinSetup
 * - 잠금 중: PinLockScreen
 * - PIN 미인증: PinPad (검증 모드)
 * - PIN 인증 완료: children
 */
export function PinGuard({ children }: PinGuardProps) {
  // visibilitychange 감지 시작
  usePinLock()

  const t = useTranslations('pin')

  const {
    isPinSet,
    isPinVerified,
    isLoading,
    failedAttempts,
    lockedUntil,
    setIsPinSet,
    setLoading,
    setFailedAttempts,
    setLockedUntil,
    setPinVerified,
    isLocked,
  } = usePinStore()

  // 마운트 시 PIN 설정 여부 서버 조회 (1회)
  useEffect(() => {
    async function checkPinStatus() {
      setLoading(true)
      try {
        const res = await fetch('/api/users/pin')
        const json = await res.json()
        setIsPinSet(res.ok ? Boolean(json.data?.pinSet) : true)
      } catch {
        // 네트워크 오류 시 설정됨으로 간주 (보안 우선)
        setIsPinSet(true)
      } finally {
        setLoading(false)
      }
    }
    checkPinStatus()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // PIN 검증 처리
  const handlePinVerify = useCallback(
    async (pin: string) => {
      try {
        const res = await fetch('/api/users/pin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
        })
        const json = await res.json()

        if (res.status === 423) {
          // 잠금 상태
          setLockedUntil(json.lockedUntil)
          return
        }

        if (res.ok && json.data?.verified) {
          // 검증 성공: sessionStorage에 저장된 salt로 PBKDF2 키 파생
          // (API 응답에서 salt를 받지 않아 서버 측 bcrypt salt 노출 방지)
          const storedSalt = sessionStorage.getItem('pin_enc_salt') ?? crypto.randomUUID()
          const key = deriveKey(pin, storedSalt)
          setFailedAttempts(0)
          setLockedUntil(null)
          setPinVerified(true, key)
          return
        }

        // 검증 실패
        const attempts: number = json.data?.failedAttempts ?? failedAttempts + 1
        setFailedAttempts(attempts)
      } catch {
        // 네트워크 오류 무시
      }
    },
    [failedAttempts, setFailedAttempts, setLockedUntil, setPinVerified],
  )

  // 에러 메시지 생성
  function getPinError(): string {
    if (failedAttempts === 0) return ''
    const remaining = 5 - failedAttempts
    if (remaining <= 2) {
      return t('wrongPinLockWarning', { attempts: failedAttempts })
    }
    return t('wrongPin', { attempts: failedAttempts })
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // PIN 미설정
  if (!isPinSet) {
    return <PinSetup onComplete={() => {}} />
  }

  // 잠금 중
  if (isLocked() && lockedUntil !== null) {
    return (
      <PinLockScreen
        lockedUntil={lockedUntil}
        onUnlock={() => setLockedUntil(null)}
      />
    )
  }

  // PIN 미인증
  if (!isPinVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PinPad
          title={t('enterPinTitle')}
          subtitle={t('enterPinSubtitle')}
          onComplete={handlePinVerify}
          error={getPinError()}
        />
      </div>
    )
  }

  // PIN 인증 완료
  return <>{children}</>
}
