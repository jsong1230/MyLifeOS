// F-03 PIN 잠금 — 타입 정의

/** PIN 입력 단계 */
export type PinStep = 'input' | 'confirm' | 'current' | 'newPin'

/** POST /api/users/pin 응답 */
export interface PinApiResponse {
  success: boolean
  data: {
    pinSet: boolean
  }
}

/** POST /api/users/pin/verify 응답 */
export interface PinVerifyResponse {
  success: boolean
  data: {
    verified: boolean
    failedAttempts?: number
    maxAttempts?: number
    remainingAttempts?: number
  }
}

/** 잠금 상태 응답 (423) */
export interface PinLockResponse {
  error: string
  lockedUntil: number
  remainingSeconds: number
}

/** PinPad 컴포넌트 props */
export interface PinPadProps {
  /** PIN 자릿수 (기본값: 6) */
  length?: number
  /** 입력 완료 시 콜백 */
  onComplete: (pin: string) => void
  /** 에러 메시지 */
  error?: string
  /** 비활성화 여부 */
  disabled?: boolean
  /** 상단 제목 */
  title?: string
  /** 상단 부제목 */
  subtitle?: string
}

/** PinSetup 컴포넌트 props */
export interface PinSetupProps {
  /** 설정 완료 시 콜백 */
  onComplete: () => void
}

/** PinGuard 컴포넌트 props */
export interface PinGuardProps {
  children: React.ReactNode
}

/** PinChange 컴포넌트 props */
export interface PinChangeProps {
  /** 변경 완료 시 콜백 */
  onComplete: () => void
  /** 취소 시 콜백 */
  onCancel: () => void
}

/** PinLockScreen 컴포넌트 props */
export interface PinLockScreenProps {
  /** 잠금 해제 시각 (Unix ms) */
  lockedUntil: number
  /** 잠금 해제 시 콜백 */
  onUnlock: () => void
}
