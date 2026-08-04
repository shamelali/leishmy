self.addEventListener("push", (event) => {
  const data = event.data?.json() || { title: "Leish!", body: "You have a new notification" };
  const options = {
    body: data.body,
    icon: "/leishlogo.png",
    badge: "/leishlogo.png",
    data: data.url || "/",
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      self.clients.openWindow(url);
    }),
  );
});
