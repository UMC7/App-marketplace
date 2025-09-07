// /public/firebase-messaging-sw.js
/* Firebase Cloud Messaging - Service Worker (producción) */
importScripts("https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js");

/* Reemplaza con tu config Web de Firebase */
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

/* Notificaciones cuando la web está en segundo plano */
messaging.onBackgroundMessage(({ notification }) => {
  if (!notification) return;
  self.registration.showNotification(notification.title, {
    body: notification.body,
    icon: "/icons/icon-192x192.png", // opcional si tienes un icono
    data: notification,
  });
});