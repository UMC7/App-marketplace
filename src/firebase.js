// src/firebase.js (CRA compatible)
import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Inicializa Firebase una sola vez
const app = initializeApp(firebaseConfig);

// CRA no permite top-level await; envolvemos isSupported en una promesa
let messaging = null;
let messagingSupported = false;

(async () => {
  try {
    messagingSupported = await isSupported();
    messaging = messagingSupported ? getMessaging(app) : null;
  } catch {
    messagingSupported = false;
    messaging = null;
  }
})();

export { app, messaging, messagingSupported };