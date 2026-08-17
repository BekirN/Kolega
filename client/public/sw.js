// KOLEGA service worker — minimalan, siguran.
// Cilj: instalabilnost + offline fallback za vec posjecene stranice/statiku.
// NE dira /api pozive ni socket.io — oni uvijek idu na mrezu.

const CACHE = 'kolega-v1'
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

  // SPA navigacije: network-first, offline -> kesirani app shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(APP_SHELL))
    )
    return
  }

  // Statika (js/css/slike/fontovi): cache-first, u pozadini osvjezi
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
