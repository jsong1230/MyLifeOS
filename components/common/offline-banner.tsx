'use client'

import { useOfflineQueue } from '@/hooks/use-offline-queue'
import { useTranslations } from 'next-intl'
import { WifiOff } from 'lucide-react'

export function OfflineBanner() {
  const { isOnline, pendingCount } = useOfflineQueue()
  const t = useTranslations('offline')

  if (isOnline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-yellow-500 px-4 py-2 text-sm font-medium text-yellow-950"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        {t('banner')}
        {pendingCount > 0 && (
          <span className="ml-1">
            {t('pendingCount', { count: pendingCount })}
          </span>
        )}
      </span>
    </div>
  )
}
