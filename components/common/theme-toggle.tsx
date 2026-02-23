'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * 다크/라이트 모드 전환 토글 버튼
 * - 시스템 테마를 기본으로 사용하며, 수동 전환을 지원합니다
 * - 하이드레이션 불일치 방지를 위해 mounted 후에만 렌더링합니다
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // next-themes 하이드레이션 불일치 방지: 마운트 전에는 렌더링하지 않음
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 마운트 전에는 동일한 크기의 빈 공간을 차지하도록 placeholder 렌더링
  if (!mounted) {
    return <div className="h-9 w-9" />
  }

  const isDark = theme === 'dark'

  function handleToggle() {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="테마 전환"
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {isDark ? (
        // 다크 모드일 때: 해 아이콘 표시 (라이트로 전환 가능 표시)
        <Sun className="h-4 w-4" />
      ) : (
        // 라이트 모드일 때: 달 아이콘 표시 (다크로 전환 가능 표시)
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
}
