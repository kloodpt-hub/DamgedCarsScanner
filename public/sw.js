self.addEventListener("install", function () {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
});

function urlBase64ToUint8Array(base64String) {
  var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  var rawData = atob(base64);
  var outputArray = new Uint8Array(rawData.length);
  for (var i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

self.addEventListener("push", function (event) {
  var payload = null;
  try {
    payload = event.data ? event.data.json() : null;
  } catch {
    payload = null;
  }

  var title =
    payload && typeof payload.title === "string"
      ? payload.title
      : "DamgedCarsScanner";
  var body =
    payload && typeof payload.body === "string"
      ? payload.body
      : "New matching listing found!";

  var options = {
    body: body,
    icon: (payload && payload.icon) || "/icon-192.png",
    badge: (payload && payload.badge) || "/icon-192.png",
    data: (payload && payload.data) || {},
  };

  if (payload) {
    if (payload.tag) options.tag = payload.tag;
    if (payload.renotify === true) options.renotify = true;
    if (payload.image) options.image = payload.image;
    if (Array.isArray(payload.actions) && payload.actions.length > 0) {
      options.actions = payload.actions;
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  var notificationData = event.notification.data || {};
  var message = {
    type: "OPEN_NOTIFICATION",
    payload: notificationData,
  };

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (windowClients) {
        var focusedClient = null;
        for (var i = 0; i < windowClients.length; i++) {
          if (windowClients[i].focused) {
            focusedClient = windowClients[i];
            break;
          }
        }
        if (focusedClient) {
          focusedClient.postMessage(message);
          return;
        }
        if (windowClients.length > 0) {
          var client = windowClients[0];
          return client
            .focus()
            .then(function (focused) {
              (focused || client).postMessage(message);
            })
            .catch(function () {
              client.postMessage(message);
            });
        }
        var url = notificationData.url || "/";
        return clients.openWindow(url).catch(function () {
          return clients.openWindow("/");
        });
      })
  );
});

self.addEventListener("pushsubscriptionchange", function (event) {
  event.waitUntil(
    fetch("/api/notifications/status")
      .then(function (response) {
        if (!response.ok) {
          throw new Error("status request failed");
        }
        return response.json();
      })
      .then(function (data) {
        var applicationServerKey = data.vapidPublicKey || null;
        if (
          !applicationServerKey &&
          event.oldSubscription &&
          event.oldSubscription.options
        ) {
          applicationServerKey =
            event.oldSubscription.options.applicationServerKey || null;
        }
        if (!applicationServerKey) {
          return;
        }
        if (typeof applicationServerKey === "string") {
          applicationServerKey = urlBase64ToUint8Array(applicationServerKey);
        }
        return self.registration.pushManager
          .subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey,
          })
          .then(function (subscription) {
            return fetch("/api/notifications/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(subscription),
            });
          });
      })
      .catch(function () {})
  );
});
