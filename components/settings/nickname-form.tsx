'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSettings, useUpdateSettings } from '@/hooks/use-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// 닉네임 폼 — user_settings 테이블에 저장 (Google OAuth 재로그인에 영향받지 않음)
export function NicknameForm() {
  const t = useTranslations('settings')
  const { data: settings } = useSettings()
  const { mutate: updateSettings, isPending } = useUpdateSettings()
  const [nickname, setNickname] = useState('')
  const [saved, setSaved] = useState(false)

  // settings 로드 후 초기값 설정
  useEffect(() => {
    if (settings?.nickname != null) {
      setNickname(settings.nickname)
    }
  }, [settings?.nickname])

  const handleSave = () => {
    updateSettings({ nickname: nickname.trim() || null }, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      },
    })
  }

  return (
    <div className="space-y-2">
      <Label>{t('nickname')}</Label>
      <div className="flex gap-2">
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t('nicknamePlaceholder')}
          maxLength={50}
        />
        <Button onClick={handleSave} disabled={isPending}>
          {saved ? t('nicknameSaved') : t('save')}
        </Button>
      </div>
    </div>
  )
}
