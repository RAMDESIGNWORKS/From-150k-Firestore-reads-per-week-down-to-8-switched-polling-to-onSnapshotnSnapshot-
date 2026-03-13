// ============================================================
// FIREBASE MESSAGING SERVICE WORKER
// Required by Firebase Cloud Messaging for background notifications
// Must live at /public/firebase-messaging-sw.js (served from root)
// ============================================================

// Firebase versions must match what's used in the main app
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config is auto-injected by Firebase Hosting at runtime via /__/firebase/init.js
// No API keys are hardcoded here — config is served securely by Firebase infrastructure
importScripts('/__/firebase/init.js');

const messaging = firebase.messaging();

// Handle background messages (app is closed or in background)
messaging.onBackgroundMessage(payload => {
  const { title, body, icon, tag, data } = payload.notification || {};

  const notificationTitle = title || 'EA Reminder';
  const notificationOptions = {
    body: body || '',
    icon: icon || '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: tag || 'ea-notification',
    data: {
      url: data?.url || '/',
      sessionId: data?.sessionId || null,
      type: data?.type || 'general',
    },
    requireInteraction: data?.requireInteraction === 'true',
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
