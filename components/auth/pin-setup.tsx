'use client'

import { useState } from 'react'
import { PinPad } from '@/components/auth/pin-pad'
import { usePinStore } from '@/store/pin.store'
import { deriveKey } from '@/lib/crypto/encryption'
import type { PinSetupProps, PinStep } from '@/types/pin'

/**
 * PIN 최초 설정 컴포넌트 (2단계: 입력 → 확인).
 * API 성공 후 PBKDF2 키 파생 및 pin 인증 상태를 저장한다.
 */
export function PinSetup({ onComplete }: PinSetupProps) {
  const { setLoading, setPinVerified, setIsPinSet, isLoading } = usePinStore()
  const [step, setStep] = useState<PinStep>('input')
  const [firstPin, setFirstPin] = useState('')
  const [error, setError] = useState('')

  async function handleFirstPin(pin: string) {
    setFirstPin(pin)
    setStep('confirm')
    setError('')
  }

  async function handleConfirmPin(confirmPin: string) {
    if (confirmPin !== firstPin) {
      setError('PIN이 일치하지 않습니다. 다시 설정해주세요')
      setFirstPin('')
      setStep('input')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: firstPin, confirmPin }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? '오류가 발생했습니다. 다시 시도해주세요')
        setStep('input')
        setFirstPin('')
        return
      }

      // PBKDF2 키 파생 (salt는 서버에서 받은 bcrypt salt)
      const salt: string = json.data.salt
      const key = deriveKey(firstPin, salt)

      setIsPinSet(true)
      setPinVerified(true, key)
      onComplete()
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요')
      setStep('input')
      setFirstPin('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6">
      {step === 'input' ? (
        <PinPad
          title="PIN 설정"
          subtitle="PIN을 설정해주세요"
          onComplete={handleFirstPin}
          error={error}
          disabled={isLoading}
        />
      ) : (
        <PinPad
          title="PIN 확인"
          subtitle="PIN을 다시 입력해주세요"
          onComplete={handleConfirmPin}
          disabled={isLoading}
        />
      )}
      {isLoading && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">처리 중...</p>
      )}
    </div>
  )
}
