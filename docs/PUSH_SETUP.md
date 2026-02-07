# Configuración de push (chat y notificaciones)

## Por qué dejan de llegar los push después de un deploy/rebuild

El flujo de push para **chat privado** es:

1. El usuario envía un mensaje → se inserta en `yacht_work_messages`.
2. Un **Database Webhook** de Supabase (configurado en el Dashboard) hace POST a la Edge Function **chat_push**.
3. **chat_push** construye título/cuerpo y llama a tu app: `POST {WEB_API_URL}/api/notifyUser`.
4. **notifyUser** guarda la notificación y envía FCM/Expo a los dispositivos del usuario.

Si **WEB_API_URL** sigue apuntando a una URL vieja (por ejemplo la anterior versión de Vercel), las peticiones nunca llegan a la app nueva y los push no se envían.

---

## Checklist después de cada deploy / rebuild

### 1. Secrets de la Edge Function `chat_push`

En **Supabase Dashboard** → **Edge Functions** → **chat_push** → **Secrets** (o Variables):

- **WEB_API_URL**: URL base de tu app **actual** (ej. `https://www.yachtdaywork.com` o `https://tu-app.vercel.app`). Sin barra final.
- **WEB_API_INTERNAL_KEY**: Mismo valor que la variable de entorno **WEB_API_INTERNAL_KEY** en tu hosting (Vercel, etc.).

Si cambiaste de dominio o de URL de deploy, actualiza **WEB_API_URL** aquí.

### 2. Variable en el hosting de la app

En **Vercel** (o donde esté desplegada la app) → **Settings** → **Environment Variables**:

- **WEB_API_INTERNAL_KEY**: Debe ser exactamente el mismo que en el paso 1.  
  Si no está definida, `notifyUser` no exige clave; si está definida, todas las llamadas a `/api/notifyUser` deben llevar el header `x-internal-key` con ese valor.

### 3. Database Webhook (push de chat privado)

En **Supabase Dashboard** → **Database** → **Webhooks**:

- Debe existir un webhook sobre la tabla **`yacht_work_messages`**.
- **Event**: INSERT.
- **URL**: la de tu Edge Function, por ejemplo:  
  `https://<PROJECT_REF>.supabase.co/functions/v1/chat_push`

No hace falta configurar headers extra: la Edge Function acepta el payload estándar de Supabase (type, table, record) y construye ella misma el título y el cuerpo.

Si el webhook no existe o apunta a otra función/URL, los push de chat no se disparan.

---

## Cómo comprobar que está bien

1. **Probar notifyUser a mano** (con la misma clave que usa la Edge Function):
   ```bash
   curl -X POST https://TU_APP_URL/api/notifyUser \
     -H "Content-Type: application/json" \
     -H "x-internal-key: TU_WEB_API_INTERNAL_KEY" \
     -d '{"userId":"UUID_DEL_USUARIO","title":"Test","body":"Mensaje de prueba"}'
   ```
   - 200 + notificación en la app → bien.
   - 401 → clave incorrecta o no enviada (revisar WEB_API_INTERNAL_KEY en app y en Edge Function).
   - 500 → revisar logs del API (Firebase, Supabase, etc.).

2. **Probar el flujo completo**: enviar un mensaje en un chat privado y comprobar que al receptor le llega la notificación push (y/o la entrada en la campanita).

---

## Job preferences / otros push

Los push de **job preferences** (match de ofertas) suelen ir por otro camino (por ejemplo **pushSend** o un webhook distinto). Revisa en el Dashboard qué webhooks tienes y a qué tablas/eventos están asociados, y que las URLs sigan siendo las correctas después del deploy.

---

## Cambio de applicationId / package (Android)

Si cambiaste el **package** de la app (ej. de `com.anonymous.mimarketplacemobile` a `com.yachtdaywork.app`):

- Android trata la nueva APK como **otra app**: los FCM/Expo tokens antiguos dejan de ser válidos para la nueva identidad.
- Los push pueden “llegar” al backend y a Expo (200, ticket ok) pero **Android descarta** la notificación en background porque el token no corresponde a la app instalada.
- Al abrir la app, se registra un **token nuevo**; por eso a veces la notificación “aparece” al entrar.

**Acción única obligatoria:** invalidar todos los tokens Android antiguos para que solo se usen los registrados por la nueva APK.

### Cómo invalidar tokens Android (una vez)

Llama al endpoint con la misma clave interna que usas para el backend:

```bash
curl -X POST https://www.yachtdaywork.com/api/push/invalidate \
  -H "Content-Type: application/json" \
  -H "x-internal-key: TU_WEB_API_INTERNAL_KEY"
```

Respuesta esperada: `{ "success": true, "message": "..." }`.

A partir de ahí:

- Los usuarios que **abran la app** (nueva versión) volverán a registrar su token y recibirán push en background.
- Los que no la hayan abierto no tendrán token válido hasta que la abran (comportamiento correcto tras el cambio de package).
