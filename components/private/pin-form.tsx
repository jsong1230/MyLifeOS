'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PinFormProps {
  /** PIN이 이미 설정되어 있는지 여부. true이면 현재 PIN 입력 필드를 추가로 표시. */
  hasPinAlready: boolean
  /** 완료 콜백 */
  onComplete: () => void
}

/**
 * PIN 설정/변경 폼 컴포넌트.
 * - PIN 미설정 상태: 새 PIN 입력 + 새 PIN 확인
 * - PIN 설정 상태: 현재 PIN 입력 + 새 PIN 입력 + 새 PIN 확인
 */
export function PinForm({ hasPinAlready, onComplete }: PinFormProps) {
  const t = useTranslations('private.pin')
  const tCommon = useTranslations('common')

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    // 클라이언트 사이드 유효성 검사
    if (!/^\d{4,6}$/.test(newPin)) {
      setError(t('pinFormValidation'))
      return
    }
    if (newPin !== confirmPin) {
      setError(t('newPinMismatch'))
      return
    }

    setLoading(true)
    try {
      const body: Record<string, string> = { pin: newPin, confirmPin }
      if (hasPinAlready) {
        body.currentPin = currentPin
      }

      const res = await fetch('/api/users/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json() as { success?: boolean; error?: string }

      if (!res.ok) {
        setError(json.error ?? t('generalError'))
        return
      }

      setSuccess(hasPinAlready ? t('pinChanged') : t('pinSet'))
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
      onComplete()
    } catch {
      setError(t('networkError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* PIN이 이미 설정된 경우 현재 PIN 입력 필드 표시 */}
      {hasPinAlready && (
        <div className="space-y-1.5">
          <Label htmlFor="current-pin">{t('currentPinLabel')}</Label>
          <Input
            id="current-pin"
            type="password"
            inputMode="numeric"
            pattern="\d{4,6}"
            maxLength={6}
            placeholder={t('currentPinPlaceholder')}
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
      )}

      {/* 새 PIN 입력 */}
      <div className="space-y-1.5">
        <Label htmlFor="new-pin">{hasPinAlready ? t('newPinLabel') : t('pinLabel')}</Label>
        <Input
          id="new-pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4,6}"
          maxLength={6}
          placeholder={t('pinPlaceholder')}
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      {/* 새 PIN 확인 */}
      <div className="space-y-1.5">
        <Label htmlFor="confirm-pin">{hasPinAlready ? t('newPinConfirmLabel') : t('pinConfirmLabel')}</Label>
        <Input
          id="confirm-pin"
          type="password"
          inputMode="numeric"
          pattern="\d{4,6}"
          maxLength={6}
          placeholder={t('pinConfirmPlaceholder')}
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          autoComplete="new-password"
          required
        />
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* 성공 메시지 */}
      {success && (
        <p className="text-sm text-green-600" role="status">
          {success}
        </p>
      )}

      {/* 제출 버튼 */}
      <Button
        type="submit"
        className="w-full"
        disabled={loading}
      >
        {loading ? tCommon('processing') : hasPinAlready ? t('changePinTitle') : t('setPinTitle')}
      </Button>
    </form>
  )
}
