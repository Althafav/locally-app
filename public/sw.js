// Minimal service worker: makes the app installable and shows a friendly
// offline page for navigations. API calls always go to the network.
const CACHE = "locally-v1";
const OFFLINE_HTML = `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1">
<title>Offline · Locally</title><body style="font-family:system-ui;background:#F4F5F7;color:#111827;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px">
<div><h1 style="font-size:20px">You're offline</h1><p style="color:#4B5563">Check your connection and try again.</p>
<button onclick="location.reload()" style="margin-top:12px;background:#0B8746;color:#fff;border:0;border-radius:999px;padding:12px 20px;font-weight:600">Retry</button></div>`;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || url.pathname.startsWith("/api/")) return;

  // Static build assets: cache-first (they are content-hashed).
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })
    );
    return;
  }

  // Pages: network-first, offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html" } })));
  }
});
