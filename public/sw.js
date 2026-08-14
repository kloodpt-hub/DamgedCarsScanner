self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "New Listing", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "DamgedCarsScanner";
  const options = {
    body: data.body || "New matching listing found!",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: data.url ? { url: data.url } : {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url;
  if (url) {
    event.waitUntil(clients.openWindow(url));
  }
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: event.oldSubscription
          ? event.oldSubscription.applicationServerKey
          : undefined,
      })
      .then((subscription) => {
        return fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });
      })
  );
});
