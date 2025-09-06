import admin from 'firebase-admin';

// Lee el contenido JSON de la variable de entorno
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Si la variable no está configurada, lanza un error claro
if (!serviceAccountString) {
  throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está configurada.');
}

try {
  // 🟢 CORRECCIÓN CLAVE: Reemplaza los caracteres de salto de línea
  // por saltos de línea reales para que el JSON se pueda analizar.
  const sanitizedServiceAccountString = serviceAccountString.replace(/\\n/g, '\n');
  const serviceAccount = JSON.parse(sanitizedServiceAccountString);
  
  // Inicializa el SDK de Firebase Admin solo una vez
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('🛑 FIREBASE INIT ERROR:', error);
  throw new Error('Error al inicializar Firebase Admin SDK: ' + error.message);
}

// Lógica para manejar la petición de la API
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { deviceToken, title, body } = req.body;

  if (!deviceToken || !title || !body) {
    return res.status(400).json({ error: 'Faltan parámetros: deviceToken, title o body.' });
  }

  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: deviceToken,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notificación enviada con éxito:', response);
    return res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error al enviar la notificación:', error);
    return res.status(500).json({ error: 'Error al enviar la notificación', details: error.message });
  }
}