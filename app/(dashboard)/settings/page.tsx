'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { BookOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { PinChange } from '@/components/auth/pin-change'
import { PinForm } from '@/components/private/pin-form'
import { ThemeToggle } from '@/components/common/theme-toggle'
import { DataExport } from '@/components/settings/data-export'
import { NicknameForm } from '@/components/settings/nickname-form'
import { CurrencySelect } from '@/components/common/currency-select'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth.store'
import { useSettings, useUpdateSettings } from '@/hooks/use-settings'
import type { LocaleCode } from '@/types/settings'
import type { CurrencyCode } from '@/lib/currency'

/** GET /api/users/pin 응답 타입 */
interface PinStatusResponse {
  success: boolean
  data?: { pinSet: boolean }
}

/** 설정 페이지 뷰 모드 */
type SettingsView = 'main' | 'pinSetup' | 'pinChange'

/**
 * 설정 페이지 — 언어/통화/PIN/테마 설정 포함
 */
export default function SettingsPage() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const tPin = useTranslations('pin')
  const locale = useLocale()
  const router = useRouter()
  const reset = useAuthStore((s) => s.reset)
  const manualHref = locale === 'en' ? '/manual.en.html' : '/manual.html'
  const manualLabel = t('userGuideLink')
  const [view, setView] = useState<SettingsView>('main')
  const [successMessage, setSuccessMessage] = useState('')
  const [pinSet, setPinSet] = useState<boolean | null>(null)

  const { data: settings } = useSettings()
  const { mutate: updateSettings, isPending } = useUpdateSettings()

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

  function handlePinSetupComplete() {
    setView('main')
    setPinSet(true)
    setSuccessMessage(tPin('setupComplete'))
  }

  function handlePinChangeComplete() {
    setView('main')
    setSuccessMessage(tPin('changeComplete'))
  }

  function handleLocaleChange(locale: LocaleCode) {
    updateSettings({ locale }, {
      onSuccess: () => setSuccessMessage(t('saved')),
    })
  }

  function handleCurrencyChange(currency: CurrencyCode) {
    updateSettings({ default_currency: currency }, {
      onSuccess: () => setSuccessMessage(t('saved')),
    })
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    reset()
    router.push('/login')
  }

  async function handleDeleteAccount() {
    const res = await fetch('/api/users/delete-request', { method: 'POST' })
    if (res.ok) {
      // 계정 삭제 완료 → 세션 정리 후 로그인 페이지로 이동
      const supabase = createClient()
      await supabase.auth.signOut()
      reset()
      router.push('/login')
    } else {
      setSuccessMessage(t('deleteAccountFailed'))
    }
  }

  if (view === 'pinSetup') {
    return (
      <div className="container max-w-lg mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-6">
          <button
            type="button"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setView('main')}
          >
            {t('backButton')}
          </button>
          <h1 className="text-2xl font-bold">{tPin('setupTitle')}</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{tPin('setupTitle')}</CardTitle>
            <CardDescription>{tPin('setupDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <PinForm hasPinAlready={false} onComplete={handlePinSetupComplete} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (view === 'pinChange') {
    return (
      <PinChange
        onComplete={handlePinChangeComplete}
        onCancel={() => setView('main')}
      />
    )
  }

  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
          {successMessage}
        </div>
      )}

      {/* 프로필 섹션 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('profile')}</CardTitle>
          <CardDescription>{t('profileDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <NicknameForm />
        </CardContent>
      </Card>

      {/* 언어 섹션 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('language')}</CardTitle>
          <CardDescription>{t('languageDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleLocaleChange('ko')}
              className={`px-4 py-2 rounded-md text-sm border transition-colors ${
                (settings?.locale ?? 'ko') === 'ko'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input hover:bg-muted'
              }`}
            >
              한국어
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleLocaleChange('en')}
              className={`px-4 py-2 rounded-md text-sm border transition-colors ${
                (settings?.locale ?? 'ko') === 'en'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-input hover:bg-muted'
              }`}
            >
              English
            </button>
          </div>
        </CardContent>
      </Card>

      {/* 기본 통화 섹션 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('currency')}</CardTitle>
          <CardDescription>{t('currencyDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <CurrencySelect
            value={(settings?.default_currency ?? 'KRW') as CurrencyCode}
            onChange={handleCurrencyChange}
          />
        </CardContent>
      </Card>

      {/* 테마 섹션 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('theme')}</CardTitle>
          <CardDescription>{t('themeDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t('darkMode')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t('darkModeDescription')}
              </p>
            </div>
            <ThemeToggle />
          </div>
        </CardContent>
      </Card>

      {/* 데이터 내보내기 섹션 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{t('dataExport')}</CardTitle>
          <CardDescription>{t('dataExportDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataExport />
        </CardContent>
      </Card>

      {/* 사용자 가이드 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {t('userGuideTitle')}
          </CardTitle>
          <CardDescription>{t('userGuideDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href={manualHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
          >
            {manualLabel}
          </a>
        </CardContent>
      </Card>

      {/* 보안 섹션 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('security')}</CardTitle>
          <CardDescription>{t('securityDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pinSet === null && (
            <div className="h-5 w-24 bg-muted animate-pulse rounded" />
          )}

          {pinSet === false && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {tPin('setPinPrompt')}
              </p>
              <button
                type="button"
                className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
                onClick={() => {
                  setSuccessMessage('')
                  setView('pinSetup')
                }}
              >
                {tPin('setPin')}
              </button>
            </div>
          )}

          {pinSet === true && (
            <button
              type="button"
              className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
              onClick={() => {
                setSuccessMessage('')
                setView('pinChange')
              }}
            >
              {tPin('changePin')}
            </button>
          )}
        </CardContent>
      </Card>

      {/* 계정 섹션 */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>{t('account')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 로그아웃 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{t('logout')}</p>
              <p className="text-sm text-muted-foreground">{t('logoutDescription')}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">{t('logout')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('logoutConfirm')}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLogout}>{t('logout')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {/* 회원 탈퇴 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive">{t('deleteAccount')}</p>
              <p className="text-sm text-muted-foreground">{t('deleteAccountDescription')}</p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">{t('deleteAccount')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('deleteAccountConfirm')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('deleteAccountDescription')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t('deleteAccount')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
