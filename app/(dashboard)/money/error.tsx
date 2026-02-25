'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function MoneyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
      <AlertCircle className="w-10 h-10 text-destructive" />
      <div className="text-center space-y-1">
        <h2 className="text-lg font-semibold">금전 데이터를 불러올 수 없습니다</h2>
        <p className="text-sm text-muted-foreground">
          잠시 후 다시 시도해주세요.
        </p>
      </div>
      <Button onClick={reset} variant="outline" size="sm">
        다시 시도
      </Button>
    </div>
  )
}
