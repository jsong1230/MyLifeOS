'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { validatePassword, validateConfirmPassword, getAuthErrorMessage } from '@/lib/validators/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    // 클라이언트 유효성 검사
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    const confirmError = validateConfirmPassword(password, confirmPassword)
    if (confirmError) {
      setError(confirmError)
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.updateUser({ password })

    if (authError) {
      setError(getAuthErrorMessage(authError.message))
      setIsLoading(false)
      return
    }

    router.push('/login')
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <CardHeader>
        <CardTitle className="text-xl">{t('auth.newPasswordTitle')}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.newPassword')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('auth.newPasswordConfirm')}</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="new-password"
            disabled={isLoading}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('auth.processing') : t('auth.changePassword')}
        </Button>
      </CardContent>

      <CardFooter className="justify-center text-sm text-muted-foreground">
        <Link href="/login" className="text-foreground font-medium hover:underline">
          {t('auth.backToLogin')}
        </Link>
      </CardFooter>
    </form>
  )
}
