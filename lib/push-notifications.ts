import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:mylifeos@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
)

export interface PushSubscriptionData {
  endpoint: string
  p256dh: string
  auth_key: string
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
}

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth_key },
      },
      JSON.stringify(payload)
    )
    return true
  } catch (err: unknown) {
    console.error('Push notification failed:', err)
    return false
  }
}
