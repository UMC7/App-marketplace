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
 * Construye la URL que abre la conversación de chat (no solo la tarjeta del empleo).
 * Requiere en data: offer_id (u oferta) y sender_id / other_user_id (el otro usuario del chat).
 * No exige target === 'chat': si vienen offer_id + sender_id (u otra clave de pareja), se construye la URL.
 */
export function buildChatNotificationUrl(data) {
  if (!data) return null;
  const chatParams = getChatParams(data);
  if (!chatParams) return null;
  const basePath = data.path || '/yacht-works';
  const jobId = data.job_id || data.jobId || data.query?.open || chatParams.offerId;

  const params = new URLSearchParams();
  if (jobId) params.set('open', toStringValue(jobId));
  params.set('chatOffer', chatParams.offerId);
  params.set('chatUser', chatParams.receiverId);

  return appendQueryParams(basePath, params);
}
