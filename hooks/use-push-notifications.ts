'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

interface NotificationSettings {
  enabled: boolean
  routine_reminders: boolean
  recurring_reminders: boolean
  goal_reminders: boolean
  reminder_time: string
}

export function usePushNotifications() {
  const queryClient = useQueryClient()
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window
    setIsSupported(supported)
    if ('Notification' in window) setPermission(Notification.permission)

    // 현재 구독 상태 확인
    if (supported) {
      navigator.serviceWorker.getRegistration('/sw.js').then((reg) => {
        if (reg) {
          reg.pushManager.getSubscription().then((sub) => {
            setIsSubscribed(!!sub)
          })
        }
      })
    }
  }, [])

  const { data: settings } = useQuery<NotificationSettings>({
    queryKey: ['push-settings'],
    queryFn: () => fetch('/api/push/settings').then((r) => r.json()).then((r) => r.data),
  })

  const updateSettings = useMutation({
    mutationFn: (data: Partial<NotificationSettings>) =>
      fetch('/api/push/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['push-settings'] }),
  })

  const subscribe = useCallback(async () => {
    if (!isSupported) return false
    const perm = await Notification.requestPermission()
    setPermission(perm)
    if (perm !== 'granted') return false

    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return false

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
    const json = sub.toJSON()
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      }),
    })
    setIsSubscribed(true)
    return true
  }, [isSupported])

  const unsubscribe = useCallback(async () => {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js')
    if (!reg) return
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await fetch('/api/push/unsubscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: sub.endpoint }),
      })
      await sub.unsubscribe()
    }
    setIsSubscribed(false)
  }, [])

  return { isSupported, permission, isSubscribed, settings, subscribe, unsubscribe, updateSettings }
}
