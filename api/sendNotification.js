import admin from 'firebase-admin';

// Lee el contenido JSON de la variable de entorno
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountString) {
  throw new Error('La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está configurada.');
}

try {
  const serviceAccount = JSON.parse(serviceAccountString);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  throw new Error('Error al parsear el JSON de la variable de entorno: ' + error.message);
}

// Esta es la función de Vercel que se ejecuta cuando se invoca el endpoint
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Obtenemos los datos necesarios desde el cuerpo de la petición
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