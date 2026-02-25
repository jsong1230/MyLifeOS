'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AuthForm, type AuthFormData } from '@/components/auth/auth-form'
import { createClient } from '@/lib/supabase/client'
import { getAuthErrorMessage } from '@/lib/validators/auth'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // 회원가입 성공 시 이메일 보관 (안내 화면 전환용)
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null)

  async function handleSubmit(data: AuthFormData) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password!,
    })

    if (authError) {
      setError(getAuthErrorMessage(authError.message))
      setIsLoading(false)
      return
    }

    setSignedUpEmail(data.email)
    setIsLoading(false)
  }

  // 회원가입 성공 → 이메일 인증 안내 화면 (설계서 12.4절)
  if (signedUpEmail) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-xl font-semibold">{t('auth.verifyEmailTitle')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('auth.verificationSentTo', { email: signedUpEmail })}
          <br />
          {t('auth.clickLinkToActivate')}
        </p>
        <Button asChild className="w-full" variant="outline">
          <Link href="/login">{t('auth.goToLogin')}</Link>
        </Button>
      </div>
    )
  }

  return (
    <AuthForm
      mode="signup"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  )
}
