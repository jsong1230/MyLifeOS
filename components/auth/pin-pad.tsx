'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Delete, Loader2 } from 'lucide-react'
import type { PinPadProps } from '@/types/pin'

/** 숫자 키패드 버튼 (불필요한 재렌더링 방지) */
const PadButton = memo(function PadButton({
  label,
  onClick,
  disabled,
}: {
  label: React.ReactNode
  onClick: () => void
  disabled: boolean
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-16 w-full text-xl font-semibold disabled:opacity-40"
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </Button>
  )
})

/**
 * PIN 입력 숫자 키패드 컴포넌트.
 * length만큼 입력 완료 시 onComplete를 자동 호출하고 입력값을 초기화한다.
 */
export function PinPad({
  length = 6,
  onComplete,
  error,
  disabled = false,
  verifying = false,
  title,
  subtitle,
}: PinPadProps) {
  const [pin, setPin] = useState('')

  // 입력 완료 감지 — 150ms 딜레이로 완료 도트를 잠깐 보여준 뒤 콜백 호출
  useEffect(() => {
    if (pin.length === length) {
      const timer = setTimeout(() => {
        onComplete(pin)
        setPin('')
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [pin, length, onComplete])

  // 숫자 키 입력
  const handlePress = useCallback(
    (digit: string) => {
      if (disabled || verifying) return
      setPin((prev) => {
        if (prev.length >= length) return prev
        const next = prev + digit
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(10)
        }
        return next
      })
    },
    [disabled, length],
  )

  // 백스페이스
  const handleDelete = useCallback(() => {
    if (disabled || verifying) return
    setPin((prev) => prev.slice(0, -1))
  }, [disabled])

  // 물리 키보드 지원
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (disabled || verifying) return
      if (/^[0-9]$/.test(e.key)) {
        handlePress(e.key)
      } else if (e.key === 'Backspace') {
        handleDelete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled, handlePress, handleDelete])

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xs mx-auto">
      {/* 제목 영역 */}
      {(title || subtitle) && (
        <div className="text-center">
          {title && <p className="text-lg font-semibold">{title}</p>}
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      )}

      {/* PIN 도트 표시 — verifying 중에는 스피너로 교체 */}
      <div className="flex items-center justify-center h-6">
        {verifying ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : (
          <div className="flex gap-3">
            {Array.from({ length }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-colors duration-100 ${
                  i < pin.length
                    ? pin.length === length
                      ? 'bg-green-500 border-green-500'   // 입력 완료
                      : 'bg-primary border-primary'       // 입력 중
                    : 'bg-transparent border-muted-foreground'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* 키패드 그리드 (3열) */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {digits.map((d) => (
          <PadButton
            key={d}
            label={d}
            onClick={() => handlePress(d)}
            disabled={disabled || verifying}
          />
        ))}
        {/* 빈칸 */}
        <div />
        <PadButton
          label="0"
          onClick={() => handlePress('0')}
          disabled={disabled || verifying}
        />
        <PadButton
          label={<Delete className="w-5 h-5" />}
          onClick={handleDelete}
          disabled={disabled || verifying}
        />
      </div>
    </div>
  )
}
