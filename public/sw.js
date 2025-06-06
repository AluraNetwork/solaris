self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (!url.pathname.includes('/proxy')) return;

  const raw = url.searchParams.get('url');
  const target = atob(raw);

  event.respondWith(fetch(target, {
    headers: {
      'Referer': 'https://google.com/',
      'X-Bypass': 'true'
    }
  }));
});
