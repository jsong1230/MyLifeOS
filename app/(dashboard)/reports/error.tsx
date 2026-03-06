'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('reports')
  const tc = useTranslations('common')

  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
      <AlertCircle className="w-10 h-10 text-destructive" />
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">{t('loadError')}</h2>
        <p className="text-sm text-muted-foreground">
          {tc('tryAgainLater')}
        </p>
      </div>
      <Button onClick={reset} variant="outline" size="sm">
        {tc('retry')}
      </Button>
    </div>
  )
}
