ALTER TABLE public.yacht_work_offers
  ADD COLUMN IF NOT EXISTS language_3 text,
  ADD COLUMN IF NOT EXISTS language_3_fluency text;
