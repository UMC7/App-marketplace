-- Allow years_in_rank = -1 ("New in rank welcome") and teammate_experience = -1
-- Run in Supabase SQL Editor (or via supabase db push if you use CLI)

ALTER TABLE public.yacht_work_offers
  DROP CONSTRAINT IF EXISTS yacht_work_offers_years_in_rank_check;

ALTER TABLE public.yacht_work_offers
  ADD CONSTRAINT yacht_work_offers_years_in_rank_check
  CHECK (
    (years_in_rank IS NULL)
    OR (years_in_rank = ANY (ARRAY[
      (-1)::numeric, (0)::numeric, (1)::numeric, 1.5, (2)::numeric, 2.5,
      (3)::numeric, 3.5, (4)::numeric, 4.5, (5)::numeric, (6)::numeric
    ]))
  );

-- If teammate_experience has a similar check, uncomment and run (check with the second query first):
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
-- WHERE conrelid = 'public.yacht_work_offers'::regclass AND conname LIKE '%teammate_experience%';

-- ALTER TABLE public.yacht_work_offers DROP CONSTRAINT IF EXISTS yacht_work_offers_teammate_experience_check;
-- ALTER TABLE public.yacht_work_offers ADD CONSTRAINT yacht_work_offers_teammate_experience_check ...
