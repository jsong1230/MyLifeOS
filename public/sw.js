/* eslint-disable no-undef */

// ─── 캐시 이름 ────────────────────────────────────────────────────────────────
const STATIC_CACHE = 'mylifeos-static-v1'
const API_CACHE = 'mylifeos-api-v1'

// stale-while-revalidate 대상 API 경로와 각 TTL(초)
const API_SWR_ROUTES = [
  { pattern: /^\/api\/time\/todos(\?|$)/, ttl: 3600 },
  { pattern: /^\/api\/health\/water(\?|$)/, ttl: 3600 },
  { pattern: /^\/api\/health\/meals(\?|$)/, ttl: 1800 },
  { pattern: /^\/api\/money\/transactions(\?|$)/, ttl: 1800 },
]

// ─── install / activate ──────────────────────────────────────────────────────
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

// ─── 유틸 ─────────────────────────────────────────────────────────────────────
function isCacheExpired(response, ttlSeconds) {
  const dateHeader = response.headers.get('sw-cached-at')
  if (!dateHeader) return true
  return (Date.now() - parseInt(dateHeader, 10)) / 1000 > ttlSeconds
}

function addTimestampHeader(response) {
  const headers = new Headers(response.headers)
  headers.set('sw-cached-at', String(Date.now()))
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

// ─── fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 정적 자산 (/_next/static/) → cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        if (cached) return cached
        const networkRes = await fetch(request)
        if (networkRes.ok) cache.put(request, networkRes.clone())
        return networkRes
      })
    )
    return
  }

  // API stale-while-revalidate (GET 요청만)
  if (request.method === 'GET') {
    const matched = API_SWR_ROUTES.find((r) => r.pattern.test(url.pathname + url.search))
    if (matched) {
      event.respondWith(
        caches.open(API_CACHE).then(async (cache) => {
          const cached = await cache.match(request)
          const isExpired = cached ? isCacheExpired(cached, matched.ttl) : true

          // 네트워크 요청 (백그라운드 갱신)
          const networkFetch = fetch(request)
            .then(async (res) => {
              if (res.ok) {
                const stamped = await addTimestampHeader(res.clone())
                await cache.put(request, stamped)
              }
              return res
            })
            .catch(() => null)

          // 캐시가 있고 아직 유효하면 즉시 캐시 반환 (백그라운드에서 갱신)
          if (cached && !isExpired) {
            return cached
          }

          // 캐시가 없거나 만료됐으면 네트워크 응답 대기
          const networkRes = await networkFetch
          if (networkRes) return networkRes

          // 네트워크도 실패하고 만료된 캐시라도 있으면 반환
          if (cached) return cached

          // 완전 실패 → 오프라인 응답
          return new Response(JSON.stringify({ success: false, error: 'offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
        })
      )
      return
    }
  }
})

// ─── push 알림 ────────────────────────────────────────────────────────────────
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
