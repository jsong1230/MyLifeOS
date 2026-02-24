'use client'
import { useTranslations } from 'next-intl'

export function useApiError() {
  const t = useTranslations('errors')

  function translateError(code: string | undefined): string {
    if (!code) return t('UNKNOWN')
    try {
      return t(code as Parameters<typeof t>[0])
    } catch {
      return t('UNKNOWN')
    }
  }

  return { translateError }
}
