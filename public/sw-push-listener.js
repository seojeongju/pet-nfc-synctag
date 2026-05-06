/* Web Push 알림 표시 — next-pwa Workbox가 importScripts로 로드합니다. */
self.addEventListener("push", function (event) {
  var data = {};
  try {
    if (event.data) data = event.data.json();
  } catch (e) {
    /* ignore */
  }
  var title = data.title || "LinkU";
  var url = "/";
  if (data.data && typeof data.data.url === "string") url = data.data.url;
  else if (typeof data.url === "string") url = data.url;
  var options = {
    body: typeof data.body === "string" ? data.body : "",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: typeof data.tag === "string" ? data.tag : "finder-alert",
    data: { url: url },
    requireInteraction: false,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var n = event.notification.data || {};
  var rawUrl = n.url || (n.data && n.data.url);
  var targetUrl = typeof rawUrl === "string" && rawUrl.length > 0 ? rawUrl : "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var c = clientList[i];
        if ("focus" in c) {
          try {
            c.navigate(targetUrl);
            return c.focus();
          } catch (e) {
            /* fall through */
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
