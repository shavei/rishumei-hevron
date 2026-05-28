/// <reference lib="webworker" />
// Service worker (spec §31). Workbox precaches the shell (injected manifest);
// we own the push + notificationclick handlers for Web Push.
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
precacheAndRoute((self as any).__WB_MANIFEST || []);

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;
  const payload = event.data.json() as {
    title: string;
    body: string;
    url?: string;
  };
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      dir: 'rtl',
      lang: 'he',
      data: { url: payload.url ?? '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      const existing = clients.find((c) => 'focus' in c);
      if (existing) return (existing as WindowClient).navigate(url).then((c) => c?.focus());
      return self.clients.openWindow(url);
    }),
  );
});
