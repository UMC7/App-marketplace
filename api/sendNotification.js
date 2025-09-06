import admin from 'firebase-admin';

let serviceAccount;
try {
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
  );
} catch (e) {
  throw new Error('❌ Error al decodificar la clave Firebase en base64: ' + e.message);
}

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
} catch (error) {
  console.error('🛑 FIREBASE INIT ERROR:', error);
  throw new Error('Error al inicializar Firebase Admin SDK: ' + error.message);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { title, body } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Faltan parámetros: title o body.' });
  }

  const message = {
    notification: { title, body },
    topic: 'yachtdaywork',
  };

  try {
    const response = await admin.messaging().send(message);
    return res.status(200).json({ success: true, messageId: response });
  } catch (error) {
    console.error('❌ Error al enviar la notificación:', error);
    return res.status(500).json({ error: 'Error al enviar la notificación', details: error.message });
  }
}
