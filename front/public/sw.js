// Service Worker для Web Push (VAPID).
// Контракт: см. .memory-base/specs/2026-05-07-web-push-design.md §5.1.
// Регистрируется фронтом лениво из pushClient.ts при первом enable().

self.addEventListener('install', () => {
  // Активируем новый SW сразу — без ожидания закрытия старых вкладок.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (_e) {
    // SW push без payload или невалидный JSON — оставляем дефолты.
    data = {}
  }
  const title = typeof data.title === 'string' && data.title ? data.title : 'sova-fix'
  const options = {
    body: typeof data.body === 'string' ? data.body : '',
    tag: typeof data.tag === 'string' ? data.tag : undefined,
    data: {
      url: typeof data.url === 'string' ? data.url : '/lk/',
      requestId: data.requestId,
    },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  // Безопасность: пускаем только relative-URL внутри ЛК (P-8 в design-doc).
  // Без этой проверки злоумышленник, контролирующий push-payload, мог бы
  // открыть произвольный http(s)-сайт (фишинг) от имени нашего origin.
  const raw = event.notification.data && event.notification.data.url
  const url = typeof raw === 'string' && raw.startsWith('/') ? raw : '/lk/'

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      // Если уже открыто окно с таким путём — фокусируем его.
      const existing = all.find((c) => {
        try {
          const u = new URL(c.url)
          return u.pathname + u.search === url || c.url.endsWith(url)
        } catch (_e) {
          return false
        }
      })
      if (existing) {
        try {
          await existing.focus()
        } catch (_e) {
          /* noop */
        }
        return
      }
      await self.clients.openWindow(url)
    })(),
  )
})
