'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { PinPad } from '@/components/auth/pin-pad'
import { usePinStore } from '@/store/pin.store'
import { deriveKey } from '@/lib/crypto/encryption'
import { PIN_ENC_SALT } from '@/lib/constants/pin-storage-keys'
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
  const t = useTranslations('pin')

  async function handleFirstPin(pin: string) {
    setFirstPin(pin)
    setStep('confirm')
    setError('')
  }

  async function handleConfirmPin(confirmPin: string) {
    if (confirmPin !== firstPin) {
      setError(t('pinMismatchRetry'))
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
        setError(json.error ?? t('serverError'))
        setStep('input')
        setFirstPin('')
        return
      }

      // Web Crypto PBKDF2 키 파생: 클라이언트에서 생성한 고유 salt 사용
      // localStorage에 영속 저장 — 이후 검증 시 일관된 키 파생 보장
      const salt = crypto.randomUUID()
      localStorage.setItem(PIN_ENC_SALT, salt)
      const key = await deriveKey(firstPin, salt)

      setIsPinSet(true)
      setPinVerified(true, key)
      onComplete()
    } catch {
      setError(t('networkError'))
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
          title={t('setupTitle')}
          subtitle={t('setupSubtitle')}
          onComplete={handleFirstPin}
          error={error}
          disabled={isLoading}
        />
      ) : (
        <PinPad
          title={t('confirmPin')}
          subtitle={t('confirmSubtitle')}
          onComplete={handleConfirmPin}
          disabled={isLoading}
        />
      )}
      {isLoading && (
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">{t('processing')}</p>
      )}
    </div>
  )
}
