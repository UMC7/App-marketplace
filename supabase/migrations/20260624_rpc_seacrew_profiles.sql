create index if not exists idx_profile_experiences_profile_id
  on public.profile_experiences (profile_id);

create or replace function public.rpc_seacrew_profiles()
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
      and coalesce((p.visibility_settings->>'show_in_seacrew')::boolean, true) = true
      and coalesce(nullif(lower(btrim(p.prefs_skills_lite->>'status')), ''), nullif(lower(btrim(p.prefs_skills->>'status')), ''), '') <> 'not available'
      and exists (
        select 1
        from jsonb_array_elements(
          case
            when jsonb_typeof(coalesce(p.gallery, '[]'::jsonb)) = 'array' then coalesce(p.gallery, '[]'::jsonb)
            else '[]'::jsonb
          end
        ) as gallery_item(item)
        where not (
          case
            when jsonb_typeof(gallery_item.item) = 'string' then trim(both '"' from gallery_item.item::text)
            else coalesce(gallery_item.item->>'url', gallery_item.item->>'path', gallery_item.item->>'name', '')
          end
        ) ~* '\.(mp4|webm|mov|m4v|avi|mkv)$'
      )
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
  order by b.created_at desc
$$;

grant execute on function public.rpc_seacrew_profiles() to anon;
grant execute on function public.rpc_seacrew_profiles() to authenticated;
