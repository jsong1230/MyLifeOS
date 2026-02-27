import webpush from 'web-push'

function initWebPush() {
  const subject = process.env.VAPID_SUBJECT
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY

  if (!subject || !publicKey || !privateKey) {
    throw new Error('VAPID environment variables are not set')
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
}

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
    initWebPush()
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
