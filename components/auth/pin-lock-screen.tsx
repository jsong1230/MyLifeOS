'use client'

import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { usePinStore } from '@/store/pin.store'
import type { PinLockScreenProps } from '@/types/pin'

/** 초를 MM:SS 형식으로 변환 */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

/**
 * PIN 5회 연속 오입력 후 표시되는 잠금 화면.
 * 잠금 해제까지 남은 시간을 MM:SS 형식으로 카운트다운한다.
 */
export function PinLockScreen({ lockedUntil, onUnlock }: PinLockScreenProps) {
  const resetLockState = usePinStore((s) => s.resetLockState)
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)),
  )

  useEffect(() => {
    const timer = setInterval(() => {
      const secs = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
      setRemaining(secs)
      if (secs === 0) {
        clearInterval(timer)
        resetLockState()
        onUnlock()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [lockedUntil, resetLockState, onUnlock])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6">
      <Lock className="w-16 h-16 text-destructive" />
      <div className="text-center">
        <p className="text-lg font-semibold">앱이 잠겼습니다</p>
        <p className="text-sm text-muted-foreground mt-2">
          PIN 5회 연속 오입력으로 앱이 잠겼습니다
        </p>
      </div>
      <div className="text-4xl font-mono font-bold text-destructive">
        {formatTime(remaining)}
      </div>
      <p className="text-sm text-muted-foreground">후 자동으로 해제됩니다</p>
    </div>
  )
}
