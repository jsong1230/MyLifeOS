'use client'

import { useState } from 'react'
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
      setError('새 PIN이 일치하지 않습니다. 다시 입력해주세요')
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
        setError('현재 PIN이 올바르지 않습니다')
        setCurrentPin('')
        setStep('current')
        return
      }

      if (!res.ok) {
        setError(json.error ?? '오류가 발생했습니다. 다시 시도해주세요')
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
      setError('네트워크 오류가 발생했습니다. 다시 시도해주세요')
      setStep('current')
      setCurrentPin('')
      setNewPin('')
    } finally {
      setLoading(false)
    }
  }

  const stepConfig: Record<PinStep, { title: string; subtitle: string; handler: (pin: string) => void }> = {
    current: {
      title: '현재 PIN 입력',
      subtitle: '현재 PIN을 입력해주세요',
      handler: handleCurrentPin,
    },
    newPin: {
      title: '새 PIN 설정',
      subtitle: '새 PIN을 입력해주세요',
      handler: handleNewPin,
    },
    confirm: {
      title: '새 PIN 확인',
      subtitle: '새 PIN을 다시 입력해주세요',
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
          취소
        </Button>
      )}
      {isLoading && (
        <p className="text-sm text-muted-foreground animate-pulse">처리 중...</p>
      )}
    </div>
  )
}
