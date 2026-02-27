'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Lock } from 'lucide-react'
import { PinPad } from '@/components/auth/pin-pad'
import { PinSetupPrompt } from '@/components/private/pin-setup-prompt'
import { usePinVerification } from '@/hooks/use-pin-verification'
import { PIN_ENC_KEY, PRIVATE_PIN_VERIFIED } from '@/lib/constants/pin-storage-keys'

/** GET /api/users/pin 응답 타입 */
interface PinStatusResponse {
  success: boolean
  data?: { pinSet: boolean }
  error?: string
}

// 사적 기록 모듈 레이아웃 — PIN 잠금 게이트 포함
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const t = useTranslations()
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true) // 초기 상태 확인 중
  const [pinSet, setPinSet] = useState<boolean | null>(null) // null = 조회 전

  // 마운트 시 sessionStorage 확인 후 PIN 설정 여부 API 조회
  useEffect(() => {
    async function initialize() {
      // 이미 세션에서 인증된 경우 바로 통과
      const ok = sessionStorage.getItem(PRIVATE_PIN_VERIFIED)
      if (ok === '1') {
        setVerified(true)
        setChecking(false)
        return
      }

      // PIN 설정 여부 확인
      try {
        const res = await fetch('/api/users/pin')
        const json: PinStatusResponse = await res.json()
        if (res.ok && json.success) {
          setPinSet(Boolean(json.data?.pinSet))
        } else {
          // 응답 오류 시 PIN 설정됨으로 간주 (보안 우선)
          setPinSet(true)
        }
      } catch {
        // 네트워크 오류 시 PIN 설정됨으로 간주
        setPinSet(true)
      } finally {
        setChecking(false)
      }
    }
    initialize()
  }, [])

  // PIN 검증 훅
  const { verify, isVerifying: loading } = usePinVerification({
    onSuccess: (key) => {
      sessionStorage.setItem(PIN_ENC_KEY, key)
      sessionStorage.setItem(PRIVATE_PIN_VERIFIED, '1')
      setVerified(true)
    },
    onFailure: (_, errorMessage) => {
      setError(errorMessage ?? t('errors.PIN_INVALID'))
    },
  })

  function isActive(href: string) {
    if (href === '/private') return pathname === '/private'
    return pathname.startsWith(href)
  }

  async function handlePinComplete(pin: string) {
    setError('')
    await verify(pin)
  }

  // 초기 상태 확인 중 로딩 스피너
  if (checking) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent" />
      </div>
    )
  }

  // PIN 미설정 상태 → 설정 유도 화면
  if (pinSet === false) {
    return <PinSetupPrompt />
  }

  // PIN 미인증 → 잠금 화면 (PinPad 컴포넌트 사용)
  if (!verified) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-muted">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <PinPad
          length={6}
          onComplete={handlePinComplete}
          error={error}
          disabled={loading}
          verifying={loading}
          title={t('nav.private')}
          subtitle={t('pin.enterPinSubtitle')}
        />
      </div>
    )
  }

  const navItems = [
    { label: t('private.tabs.dashboard'), href: '/private' },
    { label: t('private.tabs.diary'), href: '/private/diary' },
    { label: t('private.tabs.emotion'), href: '/private/emotion' },
    { label: t('private.tabs.relations'), href: '/private/relations' },
  ]

  // PIN 인증 완료 → 콘텐츠 표시
  return (
    <div className="flex flex-col h-full w-full min-w-0">
      <div className="border-b bg-background sticky top-0 z-10">
        <nav className="flex px-4 overflow-x-auto" aria-label={t('nav.private')}>
          {navItems.map(({ label, href }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}
