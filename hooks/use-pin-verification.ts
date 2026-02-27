'use client'

import { useState, useCallback } from 'react'
import { deriveKey } from '@/lib/crypto/encryption'
import { PIN_ENC_SALT } from '@/lib/constants/pin-storage-keys'

interface PinVerifyApiResponse {
  success: boolean
  data?: {
    verified: boolean
    failedAttempts?: number
    encSalt?: string | null
  }
  error?: string
  lockedUntil?: number
}

interface UsePinVerificationOptions {
  /** 검증 성공 시 파생된 암호화 키를 전달 */
  onSuccess: (key: string) => void
  /** PIN 잠금 상태일 때 잠금 만료 epoch (ms) 전달 */
  onLocked?: (lockedUntil: number) => void
  /** 검증 실패 시 실패 횟수와 에러 메시지 전달 */
  onFailure?: (failedAttempts: number, errorMessage?: string) => void
}

interface UsePinVerificationReturn {
  verify: (pin: string) => Promise<void>
  isVerifying: boolean
}

/**
 * PIN 검증 공통 훅.
 * - /api/users/pin/verify 호출
 * - 성공: localStorage에서 pin_enc_salt 조회(없으면 생성) → PBKDF2 키 파생 → onSuccess
 * - 잠금: onLocked
 * - 실패: onFailure
 */
export function usePinVerification({
  onSuccess,
  onLocked,
  onFailure,
}: UsePinVerificationOptions): UsePinVerificationReturn {
  const [isVerifying, setIsVerifying] = useState(false)

  const verify = useCallback(
    async (pin: string) => {
      setIsVerifying(true)
      try {
        const localEncSalt = localStorage.getItem(PIN_ENC_SALT)

        const res = await fetch('/api/users/pin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin, localEncSalt }),
        })
        const json: PinVerifyApiResponse = await res.json()

        if (res.status === 423) {
          if (onLocked && json.lockedUntil) {
            onLocked(json.lockedUntil)
          }
          return
        }

        if (res.ok && json.data?.verified) {
          // 서버 encSalt 우선, 없으면 로컬 salt, 그것도 없으면 새로 생성
          let salt = json.data.encSalt ?? localEncSalt
          if (!salt) {
            salt = crypto.randomUUID()
            localStorage.setItem(PIN_ENC_SALT, salt)
          }
          const key = deriveKey(pin, salt)
          onSuccess(key)
          return
        }

        // 검증 실패
        const attempts = json.data?.failedAttempts ?? 0
        onFailure?.(attempts, json.error)
      } catch {
        // 네트워크 오류는 조용히 무시
      } finally {
        setIsVerifying(false)
      }
    },
    [onSuccess, onLocked, onFailure],
  )

  return { verify, isVerifying }
}
