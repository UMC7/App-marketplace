-- Restaurar trigger y mejorar notify_chat_push para incluir nickname en admin chat.
-- La Edge Function admin_chat_push no estaba creando notificaciones; esta ruta sí funciona.

CREATE OR REPLACE FUNCTION public.notify_chat_push()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
  v_nickname text := 'User';
begin
  if new.receiver_id is null then
    return new;
  end if;

  if tg_table_name = 'admin_messages' then
    select coalesce(nullif(trim(nickname), ''), 'User') into v_nickname
    from public.users where id = new.sender_id limit 1;

    perform net.http_post(
      url := 'https://www.yachtdaywork.com/api/notifyUser',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-key', 'fe95c5e8721c695961c12db178542d19f5fc2eee699b8741dba73080261cdec7'
      ),
      body := jsonb_build_object(
        'userId', new.receiver_id::text,
        'title', 'New message from ' || v_nickname,
        'body', left(coalesce(new.message, ''), 120),
        'data', jsonb_build_object(
          'thread_id', new.thread_id::text,
          'sender_id', coalesce(new.sender_id::text, ''),
          'message_id', new.id::text,
          'type', 'admin_chat'
        )
      )
    );
  else
    select coalesce(nullif(trim(nickname), ''), 'User') into v_nickname
    from public.users where id = new.sender_id limit 1;

    perform net.http_post(
      url := 'https://www.yachtdaywork.com/api/notifyUser',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-internal-key', 'fe95c5e8721c695961c12db178542d19f5fc2eee699b8741dba73080261cdec7'
      ),
      body := jsonb_build_object(
        'userId', new.receiver_id::text,
        'title', 'New message from ' || v_nickname,
        'body', left(coalesce(new.message, ''), 120),
        'data', jsonb_build_object(
          'offer_id', coalesce(new.offer_id::text, ''),
          'sender_id', coalesce(new.sender_id::text, ''),
          'message_id', new.id::text
        )
      )
    );
  end if;

  return new;
end;
$function$;

-- Evitar duplicados: quitar el trigger que llama a la Edge Function (esa ruta no estaba creando notificaciones)
DROP TRIGGER IF EXISTS admin_chat_push ON admin_messages;

CREATE TRIGGER trg_notify_admin_chat_push
  AFTER INSERT ON admin_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_chat_push();
