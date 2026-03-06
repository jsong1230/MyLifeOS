'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { StickyNote } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { decrypt } from '@/lib/crypto/encryption'
import { PIN_ENC_KEY_LEGACY } from '@/lib/constants/pin-storage-keys'
import { useRawMemos } from '@/hooks/use-memos'
import { MemoCard } from './memo-card'
import type { DecryptedMemo, QuickMemo } from '@/types/memo'

// 암호화된 메모 단건 복호화
async function decryptOne(
  memo: QuickMemo,
  encKey: string,
  legacyKey?: string
): Promise<DecryptedMemo> {
  const { content_encrypted, ...rest } = memo
  try {
    const content = await decrypt(content_encrypted, encKey, legacyKey)
    return { ...rest, content: content ?? '' }
  } catch {
    return { ...rest, content: '' }
  }
}

interface MemoListProps {
  /** usePinStore에서 전달받은 암호화 키 */
  encryptionKey: string | null
  legacyEncryptionKey?: string
}

export function MemoList({ encryptionKey, legacyEncryptionKey }: MemoListProps) {
  const t = useTranslations('private.memos')
  const { data: rawMemos, isLoading, error } = useRawMemos()
  const [decryptedMemos, setDecryptedMemos] = useState<DecryptedMemo[]>([])
  const [isDecrypting, setIsDecrypting] = useState(false)

  // rawMemos 또는 encryptionKey가 변경될 때마다 일괄 복호화
  useEffect(() => {
    if (!rawMemos || rawMemos.length === 0) {
      setDecryptedMemos([])
      return
    }

    if (!encryptionKey) {
      // PIN 미인증: content 빈 문자열로 표시
      setDecryptedMemos(
        rawMemos.map(({ content_encrypted: _, ...rest }) => ({ ...rest, content: '' }))
      )
      return
    }

    let cancelled = false
    setIsDecrypting(true)

    // 레거시 키: prop 우선, 없으면 sessionStorage에서 읽기
    const legacyKey = legacyEncryptionKey
      ?? (typeof window !== 'undefined' ? (sessionStorage.getItem(PIN_ENC_KEY_LEGACY) ?? undefined) : undefined)

    Promise.all(rawMemos.map((m) => decryptOne(m, encryptionKey, legacyKey))).then(
      (results) => {
        if (cancelled) return
        // 고정 메모 상단 정렬
        const pinned = results.filter((m) => m.is_pinned)
        const unpinned = results.filter((m) => !m.is_pinned)
        setDecryptedMemos([...pinned, ...unpinned])
        setIsDecrypting(false)
      }
    )

    return () => {
      cancelled = true
    }
  }, [rawMemos, encryptionKey, legacyEncryptionKey])

  if (isLoading || isDecrypting) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-sm text-destructive text-center py-8">
        {error.message}
      </p>
    )
  }

  if (!decryptedMemos.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
        <StickyNote className="w-10 h-10" />
        <p className="text-sm">{t('empty')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {decryptedMemos.map((memo) => (
        <MemoCard key={memo.id} memo={memo} />
      ))}
    </div>
  )
}
