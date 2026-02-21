-- Eliminar trigger redundante que envía "New message" sin nickname.
-- La Edge Function admin_chat_push ya hace lo mismo pero incluye "New message from {nickname}".
-- Tener ambos produce notificaciones duplicadas; la de notify_chat_push() llega sin nombre.

DROP TRIGGER IF EXISTS trg_notify_admin_chat_push ON admin_messages;
