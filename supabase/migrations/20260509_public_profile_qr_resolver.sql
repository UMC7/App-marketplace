alter table public.public_profiles
  add column if not exists public_qr_id uuid;

update public.public_profiles
set public_qr_id = gen_random_uuid()
where public_qr_id is null;

alter table public.public_profiles
  alter column public_qr_id set default gen_random_uuid();

alter table public.public_profiles
  alter column public_qr_id set not null;

create unique index if not exists public_profiles_public_qr_id_key
  on public.public_profiles (public_qr_id);

create or replace function public.rpc_resolve_public_profile_qr(qr_id_in uuid)
returns table (
  handle text,
  share_ready boolean
)
language sql
security definer
set search_path = public
as $$
  select
    pp.handle,
    coalesce(pp.share_ready, false) as share_ready
  from public.public_profiles pp
  where pp.public_qr_id = qr_id_in
  limit 1
$$;

grant execute on function public.rpc_resolve_public_profile_qr(uuid) to anon;
grant execute on function public.rpc_resolve_public_profile_qr(uuid) to authenticated;
