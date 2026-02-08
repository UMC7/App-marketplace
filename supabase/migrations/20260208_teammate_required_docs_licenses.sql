-- Teammate Required License & Documents (for Team = true, position 2)
-- Run in Supabase → SQL Editor

ALTER TABLE public.yacht_work_offers
  ADD COLUMN IF NOT EXISTS teammate_required_licenses jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS teammate_required_engineering_licenses jsonb NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS teammate_required_documents jsonb NOT NULL DEFAULT '[]';
