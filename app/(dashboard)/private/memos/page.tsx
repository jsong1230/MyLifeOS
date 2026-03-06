'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { usePinStore } from '@/store/pin.store'
import { PIN_ENC_KEY_LEGACY } from '@/lib/constants/pin-storage-keys'
import { MemoList } from '@/components/private/memo-list'
import { MemoForm } from '@/components/private/memo-form'

// 퀵 메모 페이지 — PIN 인증 후 접근 가능
export default function MemosPage() {
  const t = useTranslations('private.memos')
  const { encryptionKey } = usePinStore()
  const [showNewForm, setShowNewForm] = useState(false)

  // 레거시 키는 sessionStorage에서 직접 읽기 (기존 데이터 복호화용)
  const legacyKey = typeof window !== 'undefined'
    ? (sessionStorage.getItem(PIN_ENC_KEY_LEGACY) ?? undefined)
    : undefined

  // PIN 키 없으면 인증 요구 안내
  if (!encryptionKey) {
    return (
      <div className="px-4 pt-2 max-w-2xl mx-auto">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <Lock className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">
              {t('pin_required')}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-4 pt-2 max-w-2xl mx-auto space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <Button size="sm" onClick={() => setShowNewForm(true)}>
          <Plus className="w-4 h-4 mr-1" />
          {t('new_memo')}
        </Button>
      </div>

      {/* 새 메모 작성 Dialog */}
      <Dialog open={showNewForm} onOpenChange={setShowNewForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">{t('new_memo')}</DialogTitle>
          </DialogHeader>
          <MemoForm
            onSuccess={() => setShowNewForm(false)}
            onCancel={() => setShowNewForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* 메모 목록 */}
      <MemoList encryptionKey={encryptionKey} legacyEncryptionKey={legacyKey} />
    </div>
  )
}
