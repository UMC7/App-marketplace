-- Fix yacht_work_offers_type_check: incluir 'Freelance' y permitir NULL
-- Error: new row for relation "yacht_work_offers" violates check constraint "yacht_work_offers_type_check"
-- El formulario (yachtOfferForm.constants.js) incluye Freelance pero el constraint original no lo permitía.

ALTER TABLE public.yacht_work_offers
  DROP CONSTRAINT IF EXISTS yacht_work_offers_type_check;

ALTER TABLE public.yacht_work_offers
  ADD CONSTRAINT yacht_work_offers_type_check
  CHECK (
    type IS NULL
    OR type IN (
      'Rotational',
      'Permanent',
      'Temporary',
      'Seasonal',
      'Relief',
      'Delivery',
      'Crossing',
      'Freelance',
      'DayWork'
    )
  );
