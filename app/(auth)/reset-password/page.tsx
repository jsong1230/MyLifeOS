'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { AuthForm, type AuthFormData } from '@/components/auth/auth-form'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage } from '@/lib/validators/auth'
import { CardContent } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(data: AuthFormData) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/reset-password/update`,
    })

    if (authError) {
      setError(getAuthErrorMessage(authError.message))
      setIsLoading(false)
      return
    }

    setEmailSent(true)
    setIsLoading(false)
  }

  // 이메일 발송 완료 안내
  if (emailSent) {
    return (
      <CardContent className="py-8 text-center space-y-4">
        <div className="flex justify-center">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-xl font-semibold">이메일을 확인해주세요</h2>
        <p className="text-sm text-muted-foreground">
          비밀번호 재설정 링크를 발송했습니다.
          <br />
          메일함을 확인해주세요.
        </p>
      </CardContent>
    )
  }

  return (
    <AuthForm
      mode="reset"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  )
}
