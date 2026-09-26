-- Production baseline for the public directory + seller contact RPCs used by 8fd39fd5.
-- These functions already exist in production. Keep this file aligned with that live schema;
-- do not re-apply it to production as a new migration.

create or replace function public.rpc_public_user_summaries(p_user_ids uuid[])
returns table (
  id uuid,
  nickname text,
  avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select u.id, u.nickname, u.avatar_url
  from public.users u
  where cardinality(coalesce(p_user_ids, '{}'::uuid[])) <= 100
    and u.id = any(coalesce(p_user_ids, '{}'::uuid[]));
$$;

create or replace function public.rpc_nickname_is_available(p_nickname text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select
    case
      when p_nickname is null or length(trim(p_nickname)) < 3 or length(trim(p_nickname)) > 7 then false
      else not exists (
        select 1
        from public.users u
        where lower(u.nickname) = lower(trim(p_nickname))
      )
    end;
$$;

create or replace function public.rpc_public_product_seller(p_product_id integer)
returns table (
  nickname text,
  phone text,
  first_name text,
  last_name text
)
language sql
security definer
set search_path = public
as $$
  select
    u.nickname,
    u.phone,
    u.first_name,
    u.last_name
  from public.products p
  join public.users u on u.id = p.owner
  where p.id = p_product_id
    and (
      p.seller_contact_public is true
      or p.created_at >= timestamptz '2026-07-31T00:00:00Z'
    );
$$;

create or replace function public.rpc_cart_public_seller_contacts(p_product_ids integer[])
returns table (
  product_id integer,
  id uuid,
  first_name text,
  last_name text,
  email text,
  phone text
)
language sql
security definer
set search_path = public
as $$
  select distinct p.id as product_id, u.id, u.first_name, u.last_name, u.email, u.phone
  from public.cart c
  join public.products p on p.id = c.product_id
  join public.users u on u.id = p.owner
  where auth.uid() is not null
    and c.user_id = auth.uid()
    and cardinality(coalesce(p_product_ids, '{}'::integer[])) <= 100
    and c.product_id = any(coalesce(p_product_ids, '{}'::integer[]))
    and (
      p.seller_contact_public is true
      or p.created_at >= timestamptz '2026-07-31T00:00:00Z'
    );
$$;

create or replace function public.rpc_support_admin()
returns table (id uuid)
language sql
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.role = 'admin'
    and coalesce(u.is_blocked, false) = false
  order by u.created_at asc
  limit 1;
$$;

revoke all on function public.rpc_public_user_summaries(uuid[]) from public;
revoke all on function public.rpc_nickname_is_available(text) from public;
revoke all on function public.rpc_public_product_seller(integer) from public;
revoke all on function public.rpc_cart_public_seller_contacts(integer[]) from public;
revoke all on function public.rpc_support_admin() from public;

grant execute on function public.rpc_public_user_summaries(uuid[]) to anon, authenticated;
grant execute on function public.rpc_nickname_is_available(text) to anon, authenticated;
grant execute on function public.rpc_public_product_seller(integer) to anon, authenticated;
grant execute on function public.rpc_cart_public_seller_contacts(integer[]) to authenticated;
grant execute on function public.rpc_support_admin() to authenticated;
