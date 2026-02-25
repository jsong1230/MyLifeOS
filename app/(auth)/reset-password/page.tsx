'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AuthForm, type AuthFormData } from '@/components/auth/auth-form'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage } from '@/lib/validators/auth'
import { CardContent } from '@/components/ui/card'

export default function ResetPasswordPage() {
  const t = useTranslations()
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
        <h2 className="text-xl font-semibold">{t('auth.checkEmailTitle')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('auth.resetEmailSent')}
          <br />
          {t('auth.checkInbox')}
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
