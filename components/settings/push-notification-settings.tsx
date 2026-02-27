'use client'

import { useTranslations } from 'next-intl'
import { Bell, BellOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { usePushNotifications } from '@/hooks/use-push-notifications'

export function PushNotificationSettings() {
  const t = useTranslations('notifications')

  const {
    isSupported,
    permission,
    isSubscribed,
    settings,
    subscribe,
    unsubscribe,
    updateSettings,
  } = usePushNotifications()

  async function handleToggleEnabled(checked: boolean) {
    if (checked) {
      const success = await subscribe()
      if (success) {
        updateSettings.mutate({ enabled: true })
      }
    } else {
      await unsubscribe()
      updateSettings.mutate({ enabled: false })
    }
  }

  if (!isSupported) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-4 h-4" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('notSupported')}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (permission === 'denied') {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="w-4 h-4" />
            {t('title')}
          </CardTitle>
          <CardDescription>{t('permissionDenied')}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const isEnabled = isSubscribed && settings?.enabled !== false

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-4 h-4" />
          {t('title')}
        </CardTitle>
        <CardDescription>{t('description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 메인 토글 */}
        <div className="flex items-center justify-between">
          <Label htmlFor="push-enabled" className="font-medium">
            {isEnabled ? t('disable') : t('enable')}
          </Label>
          <Switch
            id="push-enabled"
            checked={isEnabled}
            onCheckedChange={handleToggleEnabled}
          />
        </div>

        {/* 세부 옵션 — 활성화 시에만 표시 */}
        {isEnabled && (
          <div className="space-y-3 pt-2 border-t">
            {/* 루틴 리마인더 */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="routine-reminders" className="text-sm font-medium">
                  {t('routineReminders')}
                </Label>
                <p className="text-xs text-muted-foreground">{t('routineRemindersDesc')}</p>
              </div>
              <Switch
                id="routine-reminders"
                checked={settings?.routine_reminders ?? true}
                onCheckedChange={(checked: boolean) =>
                  updateSettings.mutate({ routine_reminders: checked })
                }
              />
            </div>

            {/* 정기지출 알림 */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="recurring-reminders" className="text-sm font-medium">
                  {t('recurringReminders')}
                </Label>
                <p className="text-xs text-muted-foreground">{t('recurringRemindersDesc')}</p>
              </div>
              <Switch
                id="recurring-reminders"
                checked={settings?.recurring_reminders ?? true}
                onCheckedChange={(checked: boolean) =>
                  updateSettings.mutate({ recurring_reminders: checked })
                }
              />
            </div>

            {/* 목표 알림 */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="goal-reminders" className="text-sm font-medium">
                  {t('goalReminders')}
                </Label>
                <p className="text-xs text-muted-foreground">{t('goalRemindersDesc')}</p>
              </div>
              <Switch
                id="goal-reminders"
                checked={settings?.goal_reminders ?? true}
                onCheckedChange={(checked: boolean) =>
                  updateSettings.mutate({ goal_reminders: checked })
                }
              />
            </div>

            {/* 알림 시간 */}
            <div className="flex items-center justify-between">
              <Label htmlFor="reminder-time" className="text-sm font-medium">
                {t('reminderTime')}
              </Label>
              <input
                id="reminder-time"
                type="time"
                value={settings?.reminder_time?.slice(0, 5) ?? '09:00'}
                onChange={(e) =>
                  updateSettings.mutate({ reminder_time: e.target.value + ':00' })
                }
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
