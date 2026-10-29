-- Likes públicos en las cards de SeaCrew (Available Crew).
-- Favoritos sigue siendo privado y vive en localStorage; esto es independiente.

create table if not exists public.seacrew_profile_likes (
  profile_id uuid not null references public.public_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, user_id)
);

create index if not exists idx_seacrew_profile_likes_user
  on public.seacrew_profile_likes (user_id);

-- Registro de likes ya notificados: quitar y volver a dar like no vuelve a notificar.
create table if not exists public.seacrew_profile_like_notifications (
  profile_id uuid not null references public.public_profiles(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, user_id)
);

alter table public.seacrew_profile_likes enable row level security;
alter table public.seacrew_profile_like_notifications enable row level security;
-- seacrew_profile_like_notifications no tiene políticas: solo la usa el trigger (security definer).

create or replace function public.seacrew_profile_owner_id(p_profile_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(btrim(p.user_id::text), ''), p.id::text)
  from public.public_profiles p
  where p.id = p_profile_id
$$;

-- Supabase concede execute a anon por defecto en funciones nuevas; revocar de public no basta.
revoke all on function public.seacrew_profile_owner_id(uuid) from public, anon;
grant execute on function public.seacrew_profile_owner_id(uuid) to authenticated;

-- Cada usuario solo ve sus propias filas (para saber si ya dio like). Conteos y listas van por RPC.
drop policy if exists seacrew_profile_likes_select_own on public.seacrew_profile_likes;
create policy seacrew_profile_likes_select_own
  on public.seacrew_profile_likes
  for select
  to authenticated
  using (user_id = auth.uid());

-- Solo en nombre propio y nunca al propio perfil.
drop policy if exists seacrew_profile_likes_insert_own on public.seacrew_profile_likes;
create policy seacrew_profile_likes_insert_own
  on public.seacrew_profile_likes
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and public.seacrew_profile_owner_id(profile_id) is not null
    and public.seacrew_profile_owner_id(profile_id) <> auth.uid()::text
  );

drop policy if exists seacrew_profile_likes_delete_own on public.seacrew_profile_likes;
create policy seacrew_profile_likes_delete_own
  on public.seacrew_profile_likes
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Conteo de likes y si el usuario actual dio like, para un lote de perfiles.
create or replace function public.rpc_seacrew_like_summaries(p_profile_ids uuid[])
returns table (
  profile_id uuid,
  like_count integer,
  liked_by_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.profile_id,
    count(*)::integer as like_count,
    coalesce(bool_or(l.user_id = auth.uid()), false) as liked_by_me
  from public.seacrew_profile_likes l
  where l.profile_id = any(coalesce(p_profile_ids, '{}'::uuid[]))
  group by l.profile_id
$$;

grant execute on function public.rpc_seacrew_like_summaries(uuid[]) to anon;
grant execute on function public.rpc_seacrew_like_summaries(uuid[]) to authenticated;

-- Lista de quién dio like (solo usuarios con sesión).
create or replace function public.rpc_seacrew_profile_likers(p_profile_id uuid)
returns table (
  user_id uuid,
  nickname text,
  liked_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    l.user_id,
    coalesce(nullif(btrim(u.nickname), ''), 'User') as nickname,
    l.created_at as liked_at
  from public.seacrew_profile_likes l
  left join public.users u on u.id::text = l.user_id::text
  where l.profile_id = p_profile_id
  order by l.created_at desc
  limit 200
$$;

revoke all on function public.rpc_seacrew_profile_likers(uuid) from public, anon;
grant execute on function public.rpc_seacrew_profile_likers(uuid) to authenticated;

-- Notificación en la campana al dueño del perfil, una sola vez por usuario y perfil.
create or replace function public.notify_seacrew_profile_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner_id text;
  v_nickname text;
begin
  v_owner_id := public.seacrew_profile_owner_id(new.profile_id);
  if v_owner_id is null or v_owner_id = new.user_id::text then
    return new;
  end if;

  insert into public.seacrew_profile_like_notifications (profile_id, user_id)
  values (new.profile_id, new.user_id)
  on conflict do nothing;

  if not found then
    return new;
  end if;

  select nullif(btrim(u.nickname), '') into v_nickname
  from public.users u
  where u.id::text = new.user_id::text
  limit 1;

  begin
    insert into public.notifications (user_id, title, body, data, is_read)
    values (
      v_owner_id::uuid,
      'New like on your SeaCrew profile',
      coalesce(v_nickname, 'Someone') || ' liked your SeaCrew profile.',
      jsonb_build_object(
        'type', 'seacrew_like',
        'path', '/yacht-works?tab=crew',
        'profile_id', new.profile_id::text,
        'liker_id', new.user_id::text
      ),
      false
    );
  exception when others then
    raise warning 'notify_seacrew_profile_like failed: %', sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.notify_seacrew_profile_like() from public, anon, authenticated;

drop trigger if exists trg_notify_seacrew_profile_like on public.seacrew_profile_likes;
create trigger trg_notify_seacrew_profile_like
  after insert on public.seacrew_profile_likes
  for each row
  execute function public.notify_seacrew_profile_like();
