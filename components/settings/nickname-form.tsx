'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/store/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function NicknameForm() {
  const t = useTranslations('settings')
  const { user, setUser } = useAuthStore()
  const [nickname, setNickname] = useState(user?.user_metadata?.full_name ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.updateUser({
      data: { full_name: nickname }
    })
    if (!error && data.user) {
      setUser(data.user)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-2">
      <Label>{t('nickname')}</Label>
      <div className="flex gap-2">
        <Input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder={t('nicknamePlaceholder')}
        />
        <Button onClick={handleSave} disabled={saving}>
          {saved ? t('nicknameSaved') : t('save')}
        </Button>
      </div>
    </div>
  )
}
