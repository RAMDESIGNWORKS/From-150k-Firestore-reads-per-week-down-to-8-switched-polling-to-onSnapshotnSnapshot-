// ============================================================
// FIREBASE MESSAGING SERVICE WORKER
// Required by Firebase Cloud Messaging for background notifications
// Must live at /public/firebase-messaging-sw.js (served from root)
// ============================================================

// Firebase versions must match what's used in the main app
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config — these are public/safe to expose in service workers
// Replace with your actual Firebase project config
firebase.initializeApp({
  apiKey:            '__FIREBASE_API_KEY__',
  authDomain:        '__FIREBASE_AUTH_DOMAIN__',
  projectId:         '__FIREBASE_PROJECT_ID__',
  storageBucket:     '__FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: '__FIREBASE_MESSAGING_SENDER_ID__',
  appId:             '__FIREBASE_APP_ID__',
});

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
