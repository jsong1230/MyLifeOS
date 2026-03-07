'use client'

import { useState, useEffect, useCallback } from 'react'
import { processQueue, getPendingCount } from '@/lib/offline-queue'

export function useOfflineQueue(): { isOnline: boolean; pendingCount: number; refreshCount: () => void } {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  )
  const [pendingCount, setPendingCount] = useState<number>(0)

  const refreshCount = useCallback(() => {
    if (typeof window === 'undefined') return
    getPendingCount()
      .then(setPendingCount)
      .catch(() => setPendingCount(0))
  }, [])

  useEffect(() => {
    // 초기 pendingCount 로드
    refreshCount()
  }, [refreshCount])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // 온라인 복귀 시 큐 처리 후 카운트 갱신
      processQueue()
        .then(() => refreshCount())
        .catch(() => refreshCount())
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [refreshCount])

  return { isOnline, pendingCount, refreshCount }
}
