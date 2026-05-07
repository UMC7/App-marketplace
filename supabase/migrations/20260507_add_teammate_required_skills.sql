-- Add teammate_required_skills to yacht_work_offers
-- Stores specific skills for teammate rank in team jobs

ALTER TABLE public.yacht_work_offers
  ADD COLUMN IF NOT EXISTS teammate_required_skills text[] NOT NULL DEFAULT '{}';
