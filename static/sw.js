self.addEventListener('install', () => self.skipWaiting());

const QUIZ_MEDIA_CACHE = 'quizz-land-media-v1';

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin || !url.pathname.startsWith('/assets/quiz/')) {
    return;
  }

  event.respondWith(
    caches.open(QUIZ_MEDIA_CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;

      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })
  );
});
