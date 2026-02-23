'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { GoogleOAuthButton } from '@/components/auth/google-oauth-button'
import { validateEmail, validatePassword, validateConfirmPassword } from '@/lib/validators/auth'

// 폼 제출 시 전달되는 데이터 타입
export interface AuthFormData {
  email: string
  password?: string
  confirmPassword?: string
}

interface AuthFormProps {
  mode: 'login' | 'signup' | 'reset'
  onSubmit: (data: AuthFormData) => Promise<void>
  isLoading?: boolean
  error?: string | null
}

// mode별 UI 텍스트 설정
const MODE_CONFIG = {
  login: {
    title: '로그인',
    submitText: '로그인',
  },
  signup: {
    title: '회원가입',
    submitText: '회원가입',
  },
  reset: {
    title: '비밀번호 재설정',
    submitText: '재설정 이메일 발송',
  },
} as const

export function AuthForm({ mode, onSubmit, isLoading = false, error }: AuthFormProps) {
  const config = MODE_CONFIG[mode]

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string | undefined
    const confirmPassword = formData.get('confirmPassword') as string | undefined

    // 클라이언트 유효성 검사
    const emailError = validateEmail(email)
    if (emailError) {
      // input의 native validation 활용
      e.currentTarget.querySelector<HTMLInputElement>('[name="email"]')?.setCustomValidity(emailError)
      e.currentTarget.reportValidity()
      return
    }

    if (mode !== 'reset' && password) {
      const passwordError = validatePassword(password)
      if (passwordError) {
        e.currentTarget.querySelector<HTMLInputElement>('[name="password"]')?.setCustomValidity(passwordError)
        e.currentTarget.reportValidity()
        return
      }
    }

    if (mode === 'signup' && password && confirmPassword) {
      const confirmError = validateConfirmPassword(password, confirmPassword)
      if (confirmError) {
        e.currentTarget.querySelector<HTMLInputElement>('[name="confirmPassword"]')?.setCustomValidity(confirmError)
        e.currentTarget.reportValidity()
        return
      }
    }

    await onSubmit({
      email,
      ...(mode !== 'reset' && password ? { password } : {}),
      ...(mode === 'signup' && confirmPassword ? { confirmPassword } : {}),
    })
  }

  // input 변경 시 native validation 메시지 초기화
  function clearCustomValidity(e: React.ChangeEvent<HTMLInputElement>) {
    e.target.setCustomValidity('')
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <CardHeader>
        <CardTitle className="text-xl">{config.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 에러 메시지 */}
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* 이메일 필드 */}
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            autoComplete="email"
            disabled={isLoading}
            onChange={clearCustomValidity}
          />
        </div>

        {/* 비밀번호 필드 (reset 모드 제외) */}
        {mode !== 'reset' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">비밀번호</Label>
              {mode === 'login' && (
                <Link
                  href="/reset-password"
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              )}
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              disabled={isLoading}
              onChange={clearCustomValidity}
            />
          </div>
        )}

        {/* 비밀번호 확인 필드 (signup 모드 전용) */}
        {mode === 'signup' && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">비밀번호 확인</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="new-password"
              disabled={isLoading}
              onChange={clearCustomValidity}
            />
          </div>
        )}

        {/* 제출 버튼 */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? '처리 중...' : config.submitText}
        </Button>

        {/* Google OAuth 구분선 + 버튼 (login/signup 모드) */}
        {mode !== 'reset' && (
          <>
            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                또는
              </span>
            </div>
            <GoogleOAuthButton />
          </>
        )}
      </CardContent>

      {/* 하단 링크 */}
      <CardFooter className="flex flex-col gap-2 text-sm text-center text-muted-foreground">
        {mode === 'login' && (
          <p>
            계정이 없으신가요?{' '}
            <Link href="/signup" className="text-foreground font-medium hover:underline">
              회원가입
            </Link>
          </p>
        )}
        {mode === 'signup' && (
          <p>
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-foreground font-medium hover:underline">
              로그인
            </Link>
          </p>
        )}
        {mode === 'reset' && (
          <p>
            <Link href="/login" className="text-foreground font-medium hover:underline">
              로그인으로 돌아가기
            </Link>
          </p>
        )}
      </CardFooter>
    </form>
  )
}
