'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'

const TOTAL_STEPS = 3
const CURRENCIES = ['KRW', 'USD', 'CAD'] as const
type Currency = (typeof CURRENCIES)[number]

interface OnboardingModalProps {
  open: boolean
  onComplete: () => void
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const t = useTranslations('onboarding')
  const router = useRouter()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [currency, setCurrency] = useState<Currency>('KRW')
  const [saving, setSaving] = useState(false)

  async function patchSettings(body: Record<string, unknown>) {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  async function handleSaveCurrency() {
    setSaving(true)
    try {
      await patchSettings({ default_currency: currency })
    } finally {
      setSaving(false)
    }
    setStep(3)
  }

  async function handleComplete(redirectTo?: string) {
    await patchSettings({ onboarding_completed: true })
    queryClient.invalidateQueries({ queryKey: ['settings'] })
    onComplete()
    if (redirectTo) {
      router.push(redirectTo)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        // 완료 전 닫기 불가
      }}
    >
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* 단계 표시 progress dots */}
        <div className="flex items-center justify-center gap-2 pt-1">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i + 1 === step
                  ? 'w-6 bg-primary'
                  : i + 1 < step
                    ? 'w-2 bg-primary/60'
                    : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {t('step_of', { step, total: TOTAL_STEPS })}
        </p>

        {/* 단계 1 — 환영 */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                {t('welcome_title')}
              </DialogTitle>
            </DialogHeader>
            <p className="text-center text-sm text-muted-foreground mt-2">
              {t('welcome_desc')}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {(['time', 'money', 'health', 'private'] as const).map((mod) => (
                <div
                  key={mod}
                  className="flex flex-col items-center rounded-lg border p-3 text-sm"
                >
                  <span className="text-2xl">
                    {mod === 'time' ? '⏰' : mod === 'money' ? '💰' : mod === 'health' ? '💪' : '🔒'}
                  </span>
                  <span className="mt-1 font-medium">
                    {mod === 'time' ? '시간 관리' : mod === 'money' ? '금전 관리' : mod === 'health' ? '건강 관리' : '사적 기록'}
                  </span>
                </div>
              ))}
            </div>
            <Button className="mt-4 w-full" onClick={() => setStep(2)}>
              {t('start')}
            </Button>
          </>
        )}

        {/* 단계 2 — 기본 통화 설정 */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                {t('currency_title')}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 flex flex-col gap-3">
              {CURRENCIES.map((c) => (
                <label
                  key={c}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    currency === c
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="currency"
                    value={c}
                    checked={currency === c}
                    onChange={() => setCurrency(c)}
                    className="accent-primary"
                  />
                  <span className="font-medium">{c}</span>
                  <span className="ml-auto text-sm text-muted-foreground">
                    {c === 'KRW' ? '대한민국 원' : c === 'USD' ? 'US Dollar' : 'Canadian Dollar'}
                  </span>
                </label>
              ))}
            </div>
            <Button
              className="mt-4 w-full"
              onClick={handleSaveCurrency}
              disabled={saving}
            >
              {saving ? '...' : t('save_next')}
            </Button>
          </>
        )}

        {/* 단계 3 — 시작 완료 */}
        {step === 3 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                {t('done_title')}
              </DialogTitle>
            </DialogHeader>
            <p className="text-center text-sm text-muted-foreground mt-2">🎉</p>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() => handleComplete('/time?action=add')}
              >
                {t('add_first_todo')}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleComplete()}
              >
                {t('go_dashboard')}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
