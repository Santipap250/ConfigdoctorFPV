const CACHE_NAME = "obix-fpv-shell-v2";
const APP_SHELL = [
  "/",
  "/manifest.webmanifest",
  "/assets/obix-logo-mark.png",
  "/assets/obix-logo-192.png",
  "/assets/obix-logo-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache each shell resource independently so one transient failure does not
      // prevent the new Service Worker from installing.
      await Promise.all(APP_SHELL.map(async (url) => {
        try {
          const response = await fetch(url, { cache: "no-cache" });
          if (response.ok) await cache.put(url, response);
        } catch {
          // The next online request can populate this resource at runtime.
        }
      }));
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(request) {
  return ["script", "style", "image", "font", "manifest"].includes(request.destination)
    || new URL(request.url).pathname.startsWith("/assets/");
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request, { cache: "no-cache" }).catch(() => caches.match("/")));
    return;
  }

  // Never cache future APIs, records, or user/account responses by default.
  if (!isStaticAsset(event.request)) return;

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (!response.ok || response.type !== "basic") return response;
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
      return response;
    })),
  );
});
