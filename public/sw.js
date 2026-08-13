/* XYLab PWA Service Worker：导航请求网络优先（更新触达，离线回落外壳）；其余同源 GET 缓存优先 + 网络兜底回填。
   目标：桌面快捷方式打开 = 首访后离线可用（应用外壳与全部静态资源缓存于本机）。 */
const CACHE = 'xylab-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // HTML 外壳：网络优先（保证版本更新触达），离线时回落缓存外壳。
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put('./', clone));
          }
          return res;
        })
        .catch(() => caches.match('./'))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match('./'));
    })
  );
});
