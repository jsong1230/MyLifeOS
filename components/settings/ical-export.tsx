'use client'

import { useState } from 'react'
import { Copy, Check, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

/**
 * iCal 캘린더 구독 URL 복사 컴포넌트
 * Google Calendar, Apple Calendar 등에서 URL로 구독 가능
 */
export function ICalExport() {
  const t = useTranslations('settings')
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      const url = `${window.location.origin}/api/time/calendar/ical`
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드 API 미지원 시 폴백: input 선택 방식
      const url = `${window.location.origin}/api/time/calendar/ical`
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        onClick={handleCopy}
        className="flex items-center gap-2"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-green-600" />
            <span className="text-green-600">{t('ical_copied')}</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            {t('ical_copy_url')}
          </>
        )}
      </Button>
      <p className="text-xs text-muted-foreground">{t('ical_description')}</p>
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <Calendar className="w-3 h-3 shrink-0" />
        {t('ical_includes')}
      </p>
    </div>
  )
}
