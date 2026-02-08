-- Allow job poster to disable private chat for a specific offer.
-- Default true = chat enabled (current behaviour).

ALTER TABLE public.yacht_work_offers
  ADD COLUMN IF NOT EXISTS is_private_chat_enabled boolean NOT NULL DEFAULT true;
