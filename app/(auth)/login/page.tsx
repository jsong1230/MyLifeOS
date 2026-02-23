'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AuthForm, type AuthFormData } from '@/components/auth/auth-form'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth.store'
import { getAuthErrorMessage } from '@/lib/validators/auth'

export default function LoginPage() {
  const router = useRouter()
  const setUser = useAuthStore((state) => state.setUser)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(data: AuthFormData) {
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password!,
    })

    if (authError) {
      setError(getAuthErrorMessage(authError.message))
      setIsLoading(false)
      return
    }

    if (authData.user) {
      setUser(authData.user)
    }
    router.push('/')
  }

  return (
    <AuthForm
      mode="login"
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  )
}
