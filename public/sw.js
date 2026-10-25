// Service worker for Web Push (ADR-015): shows the notification the server pushes and, on tap,
// focuses an open window or opens the screen the notification is about. It caches nothing.
self.addEventListener("install", () => self.skipWaiting())
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()))

self.addEventListener("push", (event) => {
  let message = {}
  try {
    message = event.data ? event.data.json() : {}
  } catch {
    message = { body: event.data ? event.data.text() : "" }
  }
  event.waitUntil(
    self.registration.showNotification(message.title || "Regency", {
      body: message.body || "",
      icon: "/brand/regency-logo.png",
      tag: message.href || undefined,
      data: { href: message.href || "/" },
    }),
  )
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const href = (event.notification.data && event.notification.data.href) || "/"
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true })
      for (const client of windows) {
        if (!("focus" in client)) continue
        await client.focus()
        if ("navigate" in client) await client.navigate(href).catch(() => undefined)
        return
      }
      await self.clients.openWindow(href)
    })(),
  )
})
