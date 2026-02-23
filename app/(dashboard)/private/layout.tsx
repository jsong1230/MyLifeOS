'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Lock } from 'lucide-react'
import { PinSetupPrompt } from '@/components/private/pin-setup-prompt'
import { deriveKey } from '@/lib/crypto/encryption'

const PRIVATE_NAV_ITEMS = [
  { label: '대시보드', href: '/private' },
  { label: '일기', href: '/private/diary' },
  { label: '감정 캘린더', href: '/private/emotion' },
  { label: '인간관계', href: '/private/relations' },
] as const

/** sessionStorage 키 상수 */
const SESSION_KEY = 'private_pin_verified'
const ENC_KEY_SESSION = 'enc_key'

/** GET /api/users/pin 응답 타입 */
interface PinStatusResponse {
  success: boolean
  data?: { pinSet: boolean }
  error?: string
}

/** POST /api/users/pin/verify 성공 응답 타입 */
interface PinVerifySuccessData {
  verified: boolean
  salt?: string
}

interface PinVerifyResponse {
  success: boolean
  data?: PinVerifySuccessData
  error?: string
}

// 사적 기록 모듈 레이아웃 — PIN 잠금 게이트 포함
export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [verified, setVerified] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true) // 초기 상태 확인 중
  const [pinSet, setPinSet] = useState<boolean | null>(null) // null = 조회 전

  // 마운트 시 sessionStorage 확인 후 PIN 설정 여부 API 조회
  useEffect(() => {
    async function initialize() {
      // 이미 세션에서 인증된 경우 바로 통과
      const ok = sessionStorage.getItem(SESSION_KEY)
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

  function isActive(href: string) {
    if (href === '/private') return pathname === '/private'
    return pathname.startsWith(href)
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!pinInput) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/users/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinInput }),
      })
      const json: PinVerifyResponse = await res.json()

      if (res.ok && json.success && json.data?.verified) {
        // 암호화 키 파생: verify API가 반환하는 salt로 PBKDF2 키 생성
        const salt = json.data.salt
        if (salt) {
          const encKey = deriveKey(pinInput, salt)
          sessionStorage.setItem(ENC_KEY_SESSION, encKey)
        }
        sessionStorage.setItem(SESSION_KEY, '1')
        setVerified(true)
      } else {
        setError((json as { error?: string }).error ?? 'PIN이 올바르지 않습니다')
        setPinInput('')
      }
    } catch {
      setError('서버 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
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

  // PIN 미인증 → 잠금 화면
  if (!verified) {
    return (
      <div className="flex flex-col h-full items-center justify-center px-6">
        <div className="w-full max-w-xs space-y-6 text-center">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-muted">
              <Lock className="h-8 w-8 text-muted-foreground" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold">사적 기록</h2>
            <p className="text-sm text-muted-foreground mt-1">PIN을 입력하여 잠금을 해제하세요</p>
          </div>
          <form onSubmit={handleVerify} className="space-y-3">
            <Input
              type="password"
              inputMode="numeric"
              pattern="\d{4,6}"
              maxLength={6}
              placeholder="PIN 입력 (4~6자리)"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              autoFocus
              className="text-center text-lg tracking-widest"
              aria-label="PIN 입력"
            />
            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !pinInput}>
              {loading ? '확인 중...' : '잠금 해제'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // PIN 인증 완료 → 콘텐츠 표시
  return (
    <div className="flex flex-col h-full">
      <div className="border-b bg-background sticky top-0 z-10">
        <nav className="flex px-4 overflow-x-auto" aria-label="사적 기록 서브메뉴">
          {PRIVATE_NAV_ITEMS.map(({ label, href }) => {
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
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
