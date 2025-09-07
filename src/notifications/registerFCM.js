// src/notifications/registerFCM.js
import { initializeApp } from "firebase/app";
import supabase from "../supabase";

// ⚠️ Tu config Web de Firebase
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// ⚠️ Tu VAPID pública (Cloud Messaging → Web Push certificates)
const VAPID_KEY = "YOUR_PUBLIC_VAPID_KEY";

let app;

/** Carga perezosa del SDK de messaging (evita fallos en build/SSR) */
async function loadMessaging() {
  const { getMessaging, getToken, onMessage, isSupported } = await import("firebase/messaging");
  return { getMessaging, getToken, onMessage, isSupported };
}

/**
 * Registra SW, obtiene token FCM y lo guarda en Supabase.
 * Llamar solo cuando haya usuario autenticado.
 */
export async function registerFCM(currentUser) {
  try {
    if (typeof window === "undefined") return;            // solo navegador
    if (!currentUser?.id) return;

    // Requisitos: soporte + HTTPS
    const { isSupported } = await loadMessaging();
    const supported = await isSupported();
    if (!supported) return;
    if (window.location.protocol !== "https:") return;

    // Inicializar Firebase una sola vez
    if (!app) app = initializeApp(firebaseConfig);

    // Registrar el Service Worker
    const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    // Pedir permiso
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    // Obtener token
    const { getMessaging, getToken, onMessage } = await loadMessaging();
    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swRegistration,
    });
    if (!token) return;

    // Guardar/actualizar en Supabase
    const ua = navigator.userAgent?.slice(0, 500) || null;
    const { error } = await supabase.from("device_tokens").upsert(
      {
        user_id: currentUser.id,
        token,
        platform: "web",
        user_agent: ua,
        is_valid: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "token" }
    );
    if (error) throw error;

    // Mensajes en primer plano (opcional)
    onMessage(messaging, (_payload) => {
      // aquí puedes disparar un toast o refrescar la campanita
    });
  } catch (_err) {
    // silencioso en prod
  }
}