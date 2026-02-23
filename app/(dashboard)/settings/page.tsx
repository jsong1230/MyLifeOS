'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PinChange } from '@/components/auth/pin-change'

/**
 * 설정 페이지 — PIN 변경 기능 포함
 */
export default function SettingsPage() {
  const [showPinChange, setShowPinChange] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  function handlePinChangeComplete() {
    setShowPinChange(false)
    setSuccessMessage(
      'PIN이 변경되었습니다. 기존 암호화된 데이터는 새 PIN으로 접근됩니다',
    )
  }

  if (showPinChange) {
    return (
      <PinChange
        onComplete={handlePinChangeComplete}
        onCancel={() => setShowPinChange(false)}
      />
    )
  }

  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">설정</h1>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
          {successMessage}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>보안</CardTitle>
          <CardDescription>PIN 잠금 설정을 관리합니다</CardDescription>
        </CardHeader>
        <CardContent>
          <button
            type="button"
            className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
            onClick={() => {
              setSuccessMessage('')
              setShowPinChange(true)
            }}
          >
            PIN 변경
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
