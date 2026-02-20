-- Constraint: phone_code must be 1–3 digits (country codes per E.164)
-- Prevents users from mistakenly pasting full phone numbers into the code field.

-- Fix existing invalid rows: set to NULL when > 3 digits (full number pasted by mistake)
-- Users will need to re-enter their country code in profile
UPDATE public.users
SET phone_code = NULL
WHERE phone_code IS NOT NULL
  AND length(regexp_replace(trim(phone_code), '[^0-9]', '', 'g')) > 3;

-- Add constraint
ALTER TABLE public.users
ADD CONSTRAINT users_phone_code_valid
CHECK (
  phone_code IS NULL
  OR trim(phone_code) = ''
  OR (
    length(trim(phone_code)) <= 3
    AND trim(phone_code) ~ '^[0-9]+$'
  )
);
