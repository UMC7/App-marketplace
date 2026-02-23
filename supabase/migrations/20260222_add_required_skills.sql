-- Add required_skills (Specific skills) to yacht_work_offers
-- Same catalog as candidate profile Preferences & Skills

ALTER TABLE public.yacht_work_offers
  ADD COLUMN IF NOT EXISTS required_skills text[] NOT NULL DEFAULT '{}';
