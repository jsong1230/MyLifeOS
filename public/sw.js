/* eslint-disable no-undef */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  if (!event.data) return
  const { title, body, icon, badge, url } = event.data.json()
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: icon ?? '/icons/icon-192x192.png',
      badge: badge ?? '/icons/icon-72x72.png',
      data: { url: url ?? '/' },
      requireInteraction: false,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
