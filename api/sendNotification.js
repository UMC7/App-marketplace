import admin from 'firebase-admin';

// Obtén los valores de las nuevas variables de entorno
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

// Si alguna variable no está configurada, lanza un error claro
if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
  throw new Error('Las variables de entorno de Firebase no están configuradas correctamente.');
}

try {
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

// ----------------------------------------------------
// Lógica para manejar la petición de la API
// ----------------------------------------------------
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Obtenemos los datos necesarios desde el cuerpo de la petición
  const { deviceToken, title, body } = req.body;

  // Verificamos que los parámetros esenciales estén presentes
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
    // Intentamos enviar la notificación con Firebase Cloud Messaging
    const response = await admin.messaging().send(message);
    console.log('Notificación enviada con éxito:', response);
    return res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('Error al enviar la notificación:', error);
    return res.status(500).json({ error: 'Error al enviar la notificación', details: error.message });
  }
}