alter table public.products
  add column if not exists seller_contact_public boolean not null default false;
