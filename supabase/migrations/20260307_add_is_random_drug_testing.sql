-- Add "Random drug testing" checkbox to yacht_work_offers
-- Run in Supabase -> SQL Editor

ALTER TABLE public.yacht_work_offers
  ADD COLUMN IF NOT EXISTS is_random_drug_testing boolean NOT NULL DEFAULT false;
