const CHAT_OFFER_KEYS = ['offer_id', 'offerId', 'job_id', 'jobId'];
const CHAT_PARTNER_KEYS = [
  'sender_id',
  'senderId',
  'from_user_id',
  'fromUserId',
  'actor_id',
  'actorId',
  'other_user_id',
  'otherUserId',
];

const toStringValue = (value) => {
  if (value === undefined || value === null) return null;
  return String(value);
};

export function getChatParams(data) {
  if (!data) return null;
  const offerId = CHAT_OFFER_KEYS.map((key) => data[key]).find((value) => value);
  const receiverId = CHAT_PARTNER_KEYS.map((key) => data[key]).find((value) => value);
  if (!offerId || !receiverId) return null;
  return {
    offerId: toStringValue(offerId),
    receiverId: toStringValue(receiverId),
  };
}

export function appendQueryParams(url, params) {
  if (!params) return url;
  const query = params.toString();
  if (!query) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${query}`;
}

/**
 * Indica si el data de una notificación corresponde al mismo chat (misma oferta + mismo usuario).
 */
export function notificationDataMatchesChat(notificationData, offerId, otherUserId) {
  if (!notificationData || !offerId || !otherUserId) return false;
  const offerVal = CHAT_OFFER_KEYS.map((k) => notificationData[k]).find((v) => v != null);
  const userVal = CHAT_PARTNER_KEYS.map((k) => notificationData[k]).find((v) => v != null);
  return (
    String(offerVal) === String(offerId) && String(userVal) === String(otherUserId)
  );
}

/**
 * Construye la URL que abre solo la conversación de chat (sin abrir la tarjeta del empleo).
 * No incluye "open=" para no redirigir a la tarjeta al salir.
 */
export function buildChatNotificationUrl(data) {
  if (!data) return null;
  const chatParams = getChatParams(data);
  if (!chatParams) return null;
  const basePath = data.path || '/yacht-works';
  const params = new URLSearchParams();
  params.set('chatOffer', chatParams.offerId);
  params.set('chatUser', chatParams.receiverId);
  return appendQueryParams(basePath, params);
}

/**
 * Marca como leídas todas las notificaciones del usuario que correspondan a este chat.
 * Útil al abrir la conversación (p. ej. desde la lista) para que el contador se actualice.
 */
export async function markNotificationsForChatAsRead(supabaseClient, userId, offerId, otherUserId) {
  if (!supabaseClient || !userId || !offerId || !otherUserId) return;
  const { data: rows } = await supabaseClient
    .from('notifications')
    .select('id, data')
    .eq('user_id', userId)
    .eq('is_read', false);
  if (!rows?.length) return;
  const ids = rows
    .filter((row) => notificationDataMatchesChat(row.data, offerId, otherUserId))
    .map((r) => r.id);
  if (ids.length === 0) return;
  await supabaseClient.from('notifications').update({ is_read: true }).in('id', ids);
}
