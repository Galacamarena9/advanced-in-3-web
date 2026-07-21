const CACHE_NAME = 'vantage-english-shell-v1';
const SHELL_ASSETS = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Crítico: nunca interceptamos peticiones a Supabase, Stripe ni ningún
  // dominio externo. Solo cacheamos el "shell" estático de esta web — jamás
  // queremos servir desde caché una respuesta de pago o de datos de usuario.
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    // Network-first para el HTML: siempre intenta traer la versión más
    // reciente desplegada; si no hay conexión, cae al shell guardado
    // (modo offline básico, no funcionalidad completa).
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
