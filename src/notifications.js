// src/notifications.js (CRA compatible)
import { messaging } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";
import supabase from "./supabase";

const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY;

/**
 * Espera a que firebase.js termine de inicializar 'messaging'.
 * (firebase.js lo inicializa de forma asíncrona)
 */
async function getMessagingReady(timeoutMs = 5000) {
  const start = Date.now();
  while (true) {
    if (messaging) return messaging;
    await new Promise((r) => setTimeout(r, 50));
    if (Date.now() - start > timeoutMs) {
      throw new Error("FCM no está listo en este navegador.");
    }
  }
}

/** Registra el Service Worker de FCM (ruta fija en CRA/Vercel) */
async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  // Debe existir en public/firebase-messaging-sw.js
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  return reg;
}

/**
 * Pide permiso, obtiene el token y lo guarda en Supabase.push_tokens
 * Llama a esta función cuando el usuario esté autenticado.
 */
export async function enablePushForUser(currentUser) {
  if (!currentUser) throw new Error("No hay usuario autenticado.");

  // 1) Registrar/asegurar SW
  const swReg = await registerServiceWorker();

  // 2) Pedir permiso al navegador (si ya está concedido, no muestra popup)
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Permiso de notificaciones denegado.");

  // 3) Esperar a que FCM esté listo y obtener token usando VAPID
  const msg = await getMessagingReady();
  const token = await getToken(msg, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swReg,
  });

  if (!token) throw new Error("No se pudo obtener token de FCM.");

  // 4) Guardar token en Supabase (idempotente por onConflict: 'token')
  const { error } = await supabase
    .from("push_tokens")
    .upsert(
      {
        user_id: currentUser.id,
        token,
        platform: "web",
        user_agent: navigator.userAgent,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "token" }
    );

  if (error) throw error;

  return token;
}

/** (Opcional) Escuchar notificaciones cuando la pestaña está en primer plano */
export function onForegroundNotification(handler) {
  // handler(payload) -> payload.notification?.title/body, payload.data, etc.
  let unsub = () => {};
  (async () => {
    try {
      const msg = await getMessagingReady();
      unsub = onMessage(msg, (payload) => handler?.(payload));
    } catch (_) {
      // Silencioso si FCM no está listo
    }
  })();
  return () => unsub?.();
}

/** (Opcional) Revocar token localmente y marcar tokens como revocados en BD */
export async function disableWebPushForCurrentUser(currentUser) {
  if (!currentUser) return;
  try {
    // Nota: deleteToken requiere el objeto messaging y SW; no es crítico si falla.
    const msg = await getMessagingReady();
    const reg = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    if (msg && reg) {
      const { deleteToken } = await import("firebase/messaging");
      await deleteToken(msg);
    }
  } catch (_) {
    // ignoramos
  } finally {
    await supabase
      .from("push_tokens")
      .update({ is_revoked: true })
      .eq("user_id", currentUser.id);
  }
}

/* ===================== DEBUG SOLO SI LO NECESITAS ===================== */
/** Exponer una función global para probar obtener el token desde la consola */
export async function __debugGetFcmToken() {
  try {
    const existing = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
    const swReg = existing || (await navigator.serviceWorker.register("/firebase-messaging-sw.js"));
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    const msg = await getMessagingReady();
    const token = await getToken(msg, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    console.log("FCM token:", token);
    return token;
  } catch (e) {
    console.error("Error FCM (debug):", e);
    throw e;
  }
}

// Hacer accesible desde la consola del navegador
if (typeof window !== "undefined") {
  window.__debugGetFcmToken = __debugGetFcmToken;
}
