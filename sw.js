/* My Candy's — service worker : notifications push (nouvelles commandes) */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var data = {};
  try { data = e.data ? e.data.json() : {}; } catch (x) { try { data = { body: e.data.text() }; } catch (y) {} }
  var title = data.title || '🍬 Nouvelle commande !';
  var body = data.body || "Une commande vient d'arriver — tape pour la traiter.";
  e.waitUntil(self.registration.showNotification(title, {
    body: body,
    icon: '/assets/logo.png',
    badge: '/assets/logo.png',
    vibrate: [120, 60, 120],
    tag: 'mc-order-' + Date.now(),
    renotify: true,
    data: { url: (data.url || '/console.html#orders') }
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || '/console.html#orders';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cl) {
    for (var i = 0; i < cl.length; i++) { if (cl[i].url.indexOf('console.html') >= 0 && 'focus' in cl[i]) return cl[i].focus(); }
    if (self.clients.openWindow) return self.clients.openWindow(url);
  }));
});
