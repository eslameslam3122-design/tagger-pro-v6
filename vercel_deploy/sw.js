const CACHE_NAME = 'tagger-pro-v10';
const STATIC_ASSETS = [
  'index.html',
  'dashboard1.html',
  'offline.html',
  'css/main.css',
  'js/config.js', 'js/auth.js', 'js/ui.js', 'js/main.js', 'js/products.js',
  'js/invoices.js', 'js/customers.js', 'js/cash.js', 'js/finance.js',
  'js/reports.js', 'js/shifts.js', 'js/suppliers.js', 'js/maintenance.js',
  'js/settings.js', 'js/whatsapp.js', 'js/ai.js',
  'js/pdf.js', 'js/dexie.js', 'js/offline.js',
  'js/pagination.js', 'js/skeleton.js', 'js/errorboundary.js', 'js/lazyload.js',
  'js/activity.js', 'js/shortcuts.js', 'js/statement.js', 'js/stock-transfer.js',
  'js/receipt-settings.js', 'js/report-export.js', 'js/smart-alerts.js',
  'js/kiosk.js', 'js/qr-menu.js', 'js/custom-receipt.js',
  'vendor/js/tailwind.js', 'vendor/js/supabase.min.js',
  'vendor/fonts/cairo.css', 'vendor/fonts/cairo-arabic.woff2',
  'vendor/fonts/cairo-latin.woff2', 'vendor/fonts/cairo-latin-ext.woff2',
  'vendor/fontawesome/all.min.css',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => Promise.allSettled(STATIC_ASSETS.map(url => c.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  if (e.request.method !== 'GET') return;

  if (url.hostname.includes('supabase.co') || 
      url.hostname.includes('googleapis.com') || 
      url.hostname.includes('api.openai.com') || 
      url.hostname.includes('api.groq.com')) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          return resp;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    fetch(e.request).then(resp => {
      if (resp.status === 200) {
        const clone = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      }
      return resp;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('offline.html')))
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
