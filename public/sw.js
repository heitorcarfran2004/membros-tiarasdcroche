// Service worker MÍNIMO de propósito.
// Handler de fetch VAZIO: NÃO usa event.respondWith, NÃO tem cache.
// Um SW que intercepta com cache vazio quebra o 1º carregamento em rede
// de celular instável — por isso aqui ele só existe para tornar o app
// "instalável" como PWA, sem mexer nas requisições.

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // intencionalmente vazio — deixa a rede cuidar de tudo
})
