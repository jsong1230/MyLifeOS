'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PinChange } from '@/components/auth/pin-change'
import { PinForm } from '@/components/private/pin-form'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { DataExport } from '@/components/settings/data-export'

/** GET /api/users/pin 응답 타입 */
interface PinStatusResponse {
  success: boolean
  data?: { pinSet: boolean }
}

/** 설정 페이지 뷰 모드 */
type SettingsView = 'main' | 'pinSetup' | 'pinChange'

/**
 * 설정 페이지 — PIN 설정/변경 기능 포함
 */
export default function SettingsPage() {
  const [view, setView] = useState<SettingsView>('main')
  const [successMessage, setSuccessMessage] = useState('')
  const [pinSet, setPinSet] = useState<boolean | null>(null) // null = 로딩 중

  // 마운트 시 PIN 설정 여부 조회
  useEffect(() => {
    async function checkPinStatus() {
      try {
        const res = await fetch('/api/users/pin')
        const json: PinStatusResponse = await res.json()
        if (res.ok && json.success) {
          setPinSet(Boolean(json.data?.pinSet))
        } else {
          setPinSet(false)
        }
      } catch {
        setPinSet(false)
      }
    }
    checkPinStatus()
  }, [])

  // PIN 최초 설정 완료 핸들러
  function handlePinSetupComplete() {
    setView('main')
    setPinSet(true)
    setSuccessMessage('PIN이 설정되었습니다. 이제 사적 기록에 접근할 수 있습니다')
  }

  // PIN 변경 완료 핸들러
  function handlePinChangeComplete() {
    setView('main')
    setSuccessMessage('PIN이 변경되었습니다. 기존 암호화된 데이터는 새 PIN으로 접근됩니다')
  }

  // PIN 최초 설정 폼 화면
  if (view === 'pinSetup') {
    return (
      <div className="container max-w-lg mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setView('main')}
          >
            ← 뒤로
          </button>
          <h1 className="text-2xl font-bold">PIN 설정</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>PIN 설정</CardTitle>
            <CardDescription>
              사적 기록 접근에 사용할 PIN을 설정합니다. 4~6자리 숫자를 사용해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PinForm hasPinAlready={false} onComplete={handlePinSetupComplete} />
          </CardContent>
        </Card>
      </div>
    )
  }

  // PIN 변경 화면 (기존 PinPad 기반 컴포넌트 사용)
  if (view === 'pinChange') {
    return (
      <PinChange
        onComplete={handlePinChangeComplete}
        onCancel={() => setView('main')}
      />
    )
  }

  // 메인 설정 화면
  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">설정</h1>

      {/* 성공 메시지 */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
          {successMessage}
        </div>
      )}

      {/* 테마 섹션 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>테마</CardTitle>
          <CardDescription>앱의 색상 테마를 설정합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">다크 모드</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                OS 설정을 따르거나 수동으로 전환할 수 있습니다
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* 데이터 내보내기 섹션 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>데이터 내보내기</CardTitle>
          <CardDescription>
            모듈별 또는 전체 데이터를 CSV/JSON 형식으로 다운로드합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataExport />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>보안</CardTitle>
          <CardDescription>PIN 잠금 설정을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* PIN 로딩 중 */}
          {pinSet === null && (
            <div className="h-5 w-24 bg-muted animate-pulse rounded" />
          )}

          {/* PIN 미설정: 설정 유도 */}
          {pinSet === false && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                아직 PIN이 설정되지 않았습니다. PIN을 설정하면 사적 기록을 안전하게 보호할 수 있습니다.
              </p>
              <button
                type="button"
                className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
                onClick={() => {
                  setSuccessMessage('')
                  setView('pinSetup')
                }}
              >
                PIN 설정하기
              </button>
            </div>
          )}

          {/* PIN 설정 완료: 변경 버튼 */}
          {pinSet === true && (
            <button
              type="button"
              className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
              onClick={() => {
                setSuccessMessage('')
                setView('pinChange')
              }}
            >
              PIN 변경
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
