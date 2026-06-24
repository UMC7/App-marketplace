create index if not exists idx_public_profiles_seacrew_listing
  on public.public_profiles (share_ready, created_at desc)
  where handle is not null and btrim(handle) <> '';

create or replace function public.rpc_seacrew_filter_options()
returns table (
  ranks text[],
  cities text[],
  countries text[]
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select
      coalesce(nullif(btrim(p.prefs_skills_lite->>'rank'), ''), nullif(btrim(p.prefs_skills->>'rank'), ''), nullif(btrim(p.primary_role), ''), nullif(btrim(p.primary_department), '')) as rank,
      nullif(btrim(p.city_port), '') as city,
      nullif(btrim(p.country), '') as country
    from public.public_profiles p
    where p.share_ready = true
      and p.handle is not null
      and btrim(p.handle) <> ''
      and coalesce((p.visibility_settings->>'show_in_seacrew')::boolean, true) = true
      and coalesce(nullif(lower(btrim(p.prefs_skills_lite->>'status')), ''), nullif(lower(btrim(p.prefs_skills->>'status')), ''), '') <> 'not available'
      and jsonb_typeof(coalesce(p.gallery, '[]'::jsonb)) = 'array'
      and jsonb_array_length(coalesce(p.gallery, '[]'::jsonb)) > 0
  )
  select
    coalesce(array_agg(rank order by rank) filter (where rank is not null), '{}'::text[]) as ranks,
    coalesce(array_agg(city order by city) filter (where city is not null), '{}'::text[]) as cities,
    coalesce(array_agg(country order by country) filter (where country is not null), '{}'::text[]) as countries
  from (
    select distinct rank, city, country
    from base
  ) d
$$;

create or replace function public.rpc_seacrew_profiles_page_full(
  page_offset integer default 0,
  page_limit integer default 18
)
returns table (
  profile jsonb,
  user_nickname text,
  yachting_months integer,
  employment_status text,
  chat_receiver_id text
)
language sql
security definer
set search_path = public
as $$
  with base as (
    select p.*
    from public.public_profiles p
    where p.handle is not null
      and btrim(p.handle) <> ''
      and p.share_ready = true
    order by p.created_at desc
    offset greatest(coalesce(page_offset, 0), 0)
    limit greatest(least(coalesce(page_limit, 18), 100), 1)
  )
  select
    to_jsonb(b) as profile,
    coalesce(nick.nickname, '') as user_nickname,
    ym.yachting_months,
    case when coalesce(exp.has_current, false) then 'Employed' else 'Unemployed' end as employment_status,
    coalesce(
      nullif(case when b.user_id::text <> b.id::text then b.user_id::text else '' end, ''),
      nullif(b.user_id::text, ''),
      nullif(b.id::text, '')
    ) as chat_receiver_id
  from base b
  left join lateral (
    select u.nickname
    from (
      values
        (nullif(b.user_id::text, ''), 1),
        (nullif(b.id::text, ''), 2)
    ) as lookup(user_id, ord)
    join public.users u
      on u.id::text = lookup.user_id
    where btrim(coalesce(u.nickname, '')) <> ''
    order by lookup.ord
    limit 1
  ) nick on true
  left join lateral (
    select bool_or(coalesce(pe.is_current, false)) as has_current
    from public.profile_experiences pe
    where pe.profile_id = b.id
  ) exp on true
  left join lateral (
    select public.rpc_yachting_months(b.id) as yachting_months
  ) ym on true
$$;

grant execute on function public.rpc_seacrew_filter_options() to anon;
grant execute on function public.rpc_seacrew_filter_options() to authenticated;

grant execute on function public.rpc_seacrew_profiles_page_full(integer, integer) to anon;
grant execute on function public.rpc_seacrew_profiles_page_full(integer, integer) to authenticated;
