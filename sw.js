// يخلي الأداة تفتح من الأيقونة حتى من غير إنترنت.
// لما تعدّل index.html وترفعه تاني، غيّر رقم النسخة هنا عشان الموبايلات تاخد التحديث.
const CACHE = "clients-app-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // الصفحة نفسها: من النت الأول (عشان التحديثات)، ولو مفيش نت من النسخة المحفوظة
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put("index.html", copy)); return r; })
        .catch(() => caches.match("index.html"))
    );
    return;
  }

  // ملفات الأداة ومكتبات Excel/PDF: من المحفوظ الأول، ولو مش موجودة تتجاب وتتحفظ
  if (url.origin === location.origin || url.hostname === "cdnjs.cloudflare.com") {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return r;
      }))
    );
  }
});
