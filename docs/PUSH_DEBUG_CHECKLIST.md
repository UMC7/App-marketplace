# Checklist: push no llegan (chat + job preferences)

Revisar en este orden. Ejecuta cada paso y anota el resultado (o pégalo aquí). Sin conclusiones hasta tener todos los datos.

---

## FASE 1 — Supabase: datos y estado

### 1.1 Tokens de dispositivo

¿Hay tokens válidos y recientes?

En **Supabase SQL Editor** ejecuta:

```sql
-- Resumen por usuario y plataforma (solo válidos)
SELECT user_id, platform, is_valid, COUNT(*) AS cnt, MAX(updated_at) AS last_updated
FROM device_tokens
WHERE is_valid = true
GROUP BY user_id, platform, is_valid
ORDER BY last_updated DESC
LIMIT 20;
```

Y también (para ver si hay tokens de app Expo):

```sql
-- Tokens que son Expo (app móvil) vs FCM (web)
SELECT
  platform,
  is_valid,
  COUNT(*) AS cnt,
  MAX(updated_at) AS last_updated
FROM device_tokens
WHERE token LIKE 'ExponentPushToken[%'
GROUP BY platform, is_valid
ORDER BY last_updated DESC;
```

**Resultado que necesito:** número de filas, si hay `platform = 'android'`, si `last_updated` es reciente (hoy/ayer).

---

### 1.2 Notificaciones guardadas

¿Se están creando filas en `notifications` cuando debería (chat, job match)?

```sql
-- Últimas notificaciones creadas (últimas 24 h)
SELECT id, user_id, title, LEFT(body, 50) AS body_preview, created_at
FROM notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 15;
```

**Resultado:** ¿Hay filas? ¿Los `title`/`body` coinciden con mensajes de chat o con job match?

---

### 1.3 Trigger de chat

Confirmar que el trigger que dispara el push de chat existe y está habilitado:

```sql
-- Triggers en yacht_work_messages
SELECT tgname AS trigger_name, tgenabled AS enabled
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
WHERE c.relname = 'yacht_work_messages'
  AND NOT tgisinternal;
```

**Resultado:** nombre del trigger (ej. `trg_notify_chat_push`) y valor de `enabled` (O = origin, D = disabled, etc.).

---

### 1.4 Función que hace el HTTP (chat)

La función que hace `net.http_post` a tu API debe usar la URL y la key correctas. No podemos ver el cuerpo desde SQL sin acceso al código de la función. Anota:

- Nombre de la función (ej. `notify_chat_push`).
- En **Supabase Dashboard → Database → Functions** (o Extension `pg_net`), ¿hay algún log o historial de llamadas HTTP recientes? (Si tu proyecto usa Database Webhook en vez de trigger + pg_net, entonces el “invocador” es el webhook; revisamos eso en Vercel.)

---

## FASE 2 — Vercel / backend

### 2.1 Variables de entorno

En **Vercel → Project → Settings → Environment Variables** comprueba que existan y que no estén vacías:

- `WEB_API_INTERNAL_KEY`
- `FIREBASE_SERVICE_ACCOUNT_BASE64`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Resultado:** ¿Las cuatro están definidas para el entorno que usas (Production/Preview)? (No hace falta pegar valores.)

---

### 2.2 Logs de `/api/notifyUser`

Cuando dispares un evento que debería enviar push (ej. enviar un mensaje en un chat):

1. Vercel → **Deployments** → último deployment → **Functions**.
2. Abre la función que sirve **`/api/notifyUser`** y mira **Logs** (misma ventana o pestaña Logs).

**Resultado que necesito:**

- ¿Aparece alguna request a `notifyUser` en el momento del mensaje?
- Si aparece: **status** (200, 401, 500) y si hay líneas de error o el mensaje del JSON (ej. "No autorizado", "Faltan parámetros", etc.).
- Si no aparece: entonces el fallo está antes (Supabase no está llamando a la URL, o la URL/key son incorrectas).

---

### 2.3 Prueba manual de notifyUser

Desde tu máquina (o Postman) prueba que el endpoint responda y acepte la key:

```bash
curl -X POST "https://www.yachtdaywork.com/api/notifyUser" \
  -H "Content-Type: application/json" \
  -H "x-internal-key: TU_WEB_API_INTERNAL_KEY_REAL" \
  -d "{\"userId\": \"UN_USER_ID_REAL_DE_SUPABASE\", \"title\": \"Test push\", \"body\": \"Mensaje de prueba\"}"
```

Sustituye:

- `TU_WEB_API_INTERNAL_KEY_REAL` por el valor de `WEB_API_INTERNAL_KEY` en Vercel.
- `UN_USER_ID_REAL_DE_SUPABASE` por un `user_id` que tenga al menos un token en `device_tokens` con `is_valid = true`.

**Resultado:** Código HTTP (200, 401, 400, 500) y el cuerpo de la respuesta (si es JSON, pega las primeras líneas).

---

## FASE 3 — Cómo se invoca el push (chat vs job)

### 3.1 Chat: ¿Trigger + función o Webhook?

- Si usas **trigger** en `yacht_work_messages` + función que hace `net.http_post`:
  - Esa función debe tener la URL exacta de tu API (ej. `https://www.yachtdaywork.com/api/notifyUser`) y el header `x-internal-key` con el mismo valor que `WEB_API_INTERNAL_KEY` en Vercel.
  - Si puedes, pega aquí solo la parte de la función donde se arma `url` y `headers` (sin la key real), o confirma que la URL es la de producción actual.

- Si usas **Database Webhook** de Supabase:
  - Dashboard → **Database** → **Webhooks**: ¿existe un webhook sobre `yacht_work_messages` (evento INSERT)?
  - ¿A qué URL apunta? (Debe ser la de tu backend que luego llame a `notifyUser`, o la Edge Function que llama a `notifyUser`; si usas Edge, la URL es la de la función, no la de Vercel directamente.)

**Resultado:** Una frase tipo “uso trigger + función” o “uso webhook a [qué URL]”.

---

### 3.2 Job preferences (pushSend)

Los push de job match pasan por **`/api/pushSend`** y solo se envían si `data.target === "seajobs"`. Eso suele venir de un webhook o función que recibe el “job match” y hace POST a tu API.

- ¿Tienes en Supabase algún **webhook** o **trigger** que al detectar un job match llame a `https://www.yachtdaywork.com/api/pushSend` (o a una Edge Function que luego llame a pushSend)?
- En los logs de Vercel, ¿aparece alguna request a **`/api/pushSend`** cuando se produce un match?

**Resultado:** Sí/No para cada una y, si hay webhook, URL a la que apunta.

---

## FASE 4 — Firebase / Expo (solo si 1–3 están bien)

Solo tiene sentido si:

- En 1.1 hay tokens válidos (y Expo si usas app).
- En 2.2 o 2.3 `notifyUser` recibe la request y responde 200.

Entonces:

- **App móvil (Expo):** el token en `device_tokens` debe ser `ExponentPushToken[...]`. Ese token lo genera la app; si cambiaste `applicationId` (package) y no invalidaste tokens viejos, los tokens antiguos no sirven para la nueva APK (ya habíamos hablado de llamar a `/api/push/invalidate`).
- **Firebase:** el mismo proyecto/config que usa el backend (FCM) debe coincidir con el que usa la app (o Expo para Android). Si en el último deploy cambiaste algo de Firebase o de env vars, puede que FCM rechace o no entregue.

**Resultado (cuando lleguemos aquí):** Si notifyUser devuelve 200 y “sent: 1”, el fallo está en FCM/Expo o en el dispositivo. Si notifyUser devuelve 200 y “sent: 0, failed: 1” (y tienes el campo `errors`), pega el primer error (token + provider + code/message).

---

## Resumen de lo que necesito de ti (en orden)

1. **1.1** — Resultado de los dos SQL de `device_tokens` (resumen por user/platform y Expo vs FCM).
2. **1.2** — Resultado del SQL de `notifications` (últimas 24 h).
3. **1.3** — Nombre del trigger y si está enabled.
4. **1.4** — Cómo se invoca el push de chat (función + pg_net vs webhook) y, si hay, logs de HTTP en Supabase.
5. **2.1** — Confirmación de que las 4 env vars existen en Vercel.
6. **2.2** — Si al enviar un mensaje de chat aparece request a `notifyUser` en logs y con qué status.
7. **2.3** — Respuesta del `curl` a `notifyUser` (status + cuerpo).
8. **3.1** — Cómo está montado el push de chat (trigger+función vs webhook y URL).
9. **3.2** — Cómo se dispara job match (webhook/trigger) y si ves requests a `pushSend` en Vercel.

Con eso vamos paso a paso hasta dar con la causa sin conclusiones apresuradas.
