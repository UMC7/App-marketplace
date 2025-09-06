/* public/firebase-messaging-sw.js */
/* global self, importScripts */
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// ⚠️ Debe coincidir con tu configuración de Firebase
firebase.initializeApp({
  apiKey: "AIzaSyDMBWVm3r6k7BULTGm1uUgO1vGQqE4rjcY",
  authDomain: "yachtdaywork-push.firebaseapp.com",
  projectId: "yachtdaywork-push",
  storageBucket: "yachtdaywork-push.firebasestorage.app",
  messagingSenderId: "539607253108",
  appId: "1:539607253108:web:470d5d69f83e899908d121",
});

const messaging = firebase.messaging();

// Manejar notificaciones en segundo plano
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification || {};
  self.registration.showNotification(title || "Notification", {
    body: body || "",
    icon: icon || "/icons/icon-192.png",
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});