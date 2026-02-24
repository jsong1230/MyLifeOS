'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { PinPad } from '@/components/auth/pin-pad'
import { usePinStore } from '@/store/pin.store'
import { deriveKey } from '@/lib/crypto/encryption'
import type { PinChangeProps, PinStep } from '@/types/pin'

/**
 * PIN 변경 컴포넌트 (3단계: 기존 PIN 확인 → 새 PIN 입력 → 새 PIN 확인).
 * 변경 성공 시 새 키로 암호화 상태를 갱신한다.
 */
export function PinChange({ onComplete, onCancel }: PinChangeProps) {
  const { setLoading, setPinVerified, isLoading } = usePinStore()
  const [step, setStep] = useState<PinStep>('current')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [error, setError] = useState('')
  const t = useTranslations('pin')
  const commonT = useTranslations('common')

  function handleCurrentPin(pin: string) {
    setCurrentPin(pin)
    setStep('newPin')
    setError('')
  }

  function handleNewPin(pin: string) {
    setNewPin(pin)
    setStep('confirm')
    setError('')
  }

  async function handleConfirmPin(confirmPin: string) {
    if (confirmPin !== newPin) {
      setError(t('newPinMismatch'))
      setNewPin('')
      setStep('newPin')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin, confirmPin, currentPin }),
      })
      const json = await res.json()

      if (res.status === 403) {
        setError(t('currentPinWrong'))
        setCurrentPin('')
        setStep('current')
        return
      }

      if (!res.ok) {
        setError(json.error ?? t('serverError'))
        setStep('current')
        setCurrentPin('')
        setNewPin('')
        return
      }

      // 새 salt로 PBKDF2 키 파생
      const newSalt: string = json.data.salt
      const newKey = deriveKey(newPin, newSalt)
      setPinVerified(true, newKey)
      onComplete()
    } catch {
      setError(t('networkError'))
      setStep('current')
      setCurrentPin('')
      setNewPin('')
    } finally {
      setLoading(false)
    }
  }

  const stepConfig: Record<PinStep, { title: string; subtitle: string; handler: (pin: string) => void }> = {
    current: {
      title: t('currentPinTitle'),
      subtitle: t('currentPinSubtitle'),
      handler: handleCurrentPin,
    },
    newPin: {
      title: t('newPinTitle'),
      subtitle: t('newPinSubtitle'),
      handler: handleNewPin,
    },
    confirm: {
      title: t('confirmNewPinTitle'),
      subtitle: t('confirmNewPinSubtitle'),
      handler: handleConfirmPin,
    },
    input: {
      title: '',
      subtitle: '',
      handler: () => {},
    },
  }

  const current = stepConfig[step]

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 gap-4">
      <PinPad
        title={current.title}
        subtitle={current.subtitle}
        onComplete={current.handler}
        error={error}
        disabled={isLoading}
      />
      {step === 'current' && (
        <Button
          type="button"
          variant="ghost"
          className="mt-2"
          onClick={onCancel}
          disabled={isLoading}
        >
          {commonT('cancel')}
        </Button>
      )}
      {isLoading && (
        <p className="text-sm text-muted-foreground animate-pulse">{t('processing')}</p>
      )}
    </div>
  )
}
