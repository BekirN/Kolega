// KOLEGA service worker — minimalan, siguran.
// Cilj: instalabilnost + offline fallback za vec posjecene stranice/statiku.
// NE dira /api pozive ni socket.io — oni uvijek idu na mrezu.

const CACHE = 'kolega-v2'
const APP_SHELL = '/index.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.add(APP_SHELL)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Samo GET i samo isti origin (frontend). Sve ostalo (API, Cloudinary, socket) -> mreza.
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  // SPA navigacije: network-first, offline -> kesirani app shell.
  // Uvijek vrati Response (nikad undefined), inace baca "Failed to convert to Response".
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request)
      } catch {
        const shell = await caches.match(APP_SHELL)
        return shell || new Response('Offline', { status: 503, statusText: 'Offline' })
      }
    })())
    return
  }

  // Statika (js/css/slike/fontovi): cache-first, u pozadini osvjezi.
  event.respondWith((async () => {
    const cached = await caches.match(request)
    if (cached) return cached
    try {
      const res = await fetch(request)
      if (res && res.status === 200) {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(request, copy))
      }
      return res
    } catch {
      return new Response('', { status: 504, statusText: 'Network error' })
    }
  })())
})
