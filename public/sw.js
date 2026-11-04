// PR PWA: never serve outdated JavaScript after a production deployment.
const CACHE_NAME = 'punta-rollers-navigation-20261103-v4'
const APP_SHELL = ['/', '/manifest.webmanifest', '/pwa-192x192.png', '/pwa-512x512.png', '/pwa-maskable-512x512.png', '/apple-touch-icon.png', '/favicon-64x64.png']

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Every refresh and deep link gets the latest index.html, not a stale shell.
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, {cache:'no-store'}).then(response => {
      if (!response.ok) throw new Error('Navigation failed')
      return response
    }).catch(async () => (await caches.match('/')) || Response.error()))
    return
  }
  // Vite emits content-hashed JS/CSS. Network-first avoids mixing releases.
  if (url.pathname.startsWith('/assets/') || /\.(?:js|css|mjs)$/.test(url.pathname)) {
    event.respondWith(fetch(request).catch(() => caches.match(request).then(hit => hit || Response.error())))
    return
  }
  // Cache-first only for stable static PWA images and manifest.
  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(caches.match(request).then(hit => hit || fetch(request)))
  }
})
