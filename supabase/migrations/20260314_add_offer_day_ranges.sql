-- Support partial month ranges like Beginning / Middle / End for job start/end dates

ALTER TABLE public.yacht_work_offers
  ADD COLUMN IF NOT EXISTS start_day_range text,
  ADD COLUMN IF NOT EXISTS end_day_range text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'yacht_work_offers_start_day_range_check'
      AND conrelid = 'public.yacht_work_offers'::regclass
  ) THEN
    ALTER TABLE public.yacht_work_offers
      ADD CONSTRAINT yacht_work_offers_start_day_range_check
      CHECK (start_day_range IS NULL OR start_day_range IN ('beginning', 'middle', 'end'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'yacht_work_offers_end_day_range_check'
      AND conrelid = 'public.yacht_work_offers'::regclass
  ) THEN
    ALTER TABLE public.yacht_work_offers
      ADD CONSTRAINT yacht_work_offers_end_day_range_check
      CHECK (end_day_range IS NULL OR end_day_range IN ('beginning', 'middle', 'end'));
  END IF;
END $$;
