'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Calendar, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
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

interface CalendarTokenResponse {
  success: boolean
  data?: { token: string; url: string }
}

/**
 * iCal 캘린더 구독 URL 관리 컴포넌트
 * 토큰 기반 인증 — Google Calendar 등 외부 클라이언트에서 세션 없이 구독 가능
 */
export function ICalExport() {
  const t = useTranslations('settings')
  const tCommon = useTranslations('common')
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState(false)

  // 마운트 시 토큰 조회 (없으면 자동 발급)
  useEffect(() => {
    async function loadToken() {
      try {
        const res = await fetch('/api/users/calendar-token')
        const json: CalendarTokenResponse = await res.json()
        if (res.ok && json.success && json.data?.url) {
          setSubscriptionUrl(json.data.url)
        } else {
          setError(true)
        }
      } catch {
        setError(true)
      } finally {
        setIsLoading(false)
      }
    }
    loadToken()
  }, [])

  async function handleCopy() {
    if (!subscriptionUrl) return
    try {
      await navigator.clipboard.writeText(subscriptionUrl)
    } catch {
      // 클립보드 API 미지원 시 폴백
      const input = document.createElement('input')
      input.value = subscriptionUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    setIsRegenerating(true)
    try {
      const res = await fetch('/api/users/calendar-token', { method: 'POST' })
      const json: CalendarTokenResponse = await res.json()
      if (res.ok && json.success && json.data?.url) {
        setSubscriptionUrl(json.data.url)
        setError(false)
      }
    } catch {
      // 재발급 실패는 조용히 무시 (기존 URL 유지)
    } finally {
      setIsRegenerating(false)
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">{t('ical_token_loading')}</p>
  }

  if (error) {
    return <p className="text-sm text-destructive">{t('ical_token_error')}</p>
  }

  return (
    <div className="space-y-3">
      {/* 구독 URL 표시 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-md border bg-muted px-3 py-2 text-xs text-muted-foreground font-mono truncate select-all">
          {subscriptionUrl}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="shrink-0 flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span className="text-green-600">{t('ical_copied')}</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              {t('ical_copy_url')}
            </>
          )}
        </Button>
      </div>

      {/* URL 재발급 */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isRegenerating}
            className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
            {t('ical_regenerate')}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('ical_regenerate_confirm_title')}</AlertDialogTitle>
            <AlertDialogDescription>{t('ical_regenerate_confirm_desc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate}>
              {t('ical_regenerate')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 안내 문구 */}
      <p className="text-xs text-muted-foreground">{t('ical_description')}</p>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Calendar className="w-3 h-3 shrink-0" />
        {t('ical_includes')}
      </p>
    </div>
  )
}
