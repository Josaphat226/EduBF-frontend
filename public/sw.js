const VERSION = 'edubf-v2'
const PRECACHE = ['/hors-ligne', '/icons/icon-192.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(cles => Promise.all(cles.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Seules la page hors ligne et le logo sont gardés en mémoire. Aucun document,
// aucune réponse du serveur n'est stocké : la protection des PDF reste intacte.
self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  if (url.origin === self.location.origin && url.pathname === '/icons/icon-192.png') {
    e.respondWith(caches.match(req).then(r => r || fetch(req)))
    return
  }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('/hors-ligne')))
  }
})