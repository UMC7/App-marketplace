-- Fix profile_experiences vessel_type check to match current CV experience form.
-- Symptom: saving a yacht experience with "Sailing Yacht" fails because the UI
-- normalizes that option to "Sailing", but the database constraint does not
-- currently allow it.

DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT con.conname
    INTO v_constraint_name
  FROM pg_constraint con
  JOIN pg_class rel
    ON rel.oid = con.conrelid
  JOIN pg_namespace nsp
    ON nsp.oid = rel.relnamespace
  WHERE con.contype = 'c'
    AND nsp.nspname = 'public'
    AND rel.relname = 'profile_experiences'
    AND pg_get_constraintdef(con.oid) ILIKE '%vessel_type%'
  ORDER BY (con.conname = 'profile_experiences_vessel_type_check') DESC, con.oid DESC
  LIMIT 1;

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format(
      'ALTER TABLE public.profile_experiences DROP CONSTRAINT %I',
      v_constraint_name
    );
  END IF;
END $$;

ALTER TABLE public.profile_experiences
  ADD CONSTRAINT profile_experiences_vessel_type_check
  CHECK (
    vessel_type IS NULL
    OR vessel_type = ANY (ARRAY[
      'Motor',
      'Sailing',
      'Catamaran',
      'Chase Boat',
      'Support',
      'Expedition',
      'Motor Yacht',
      'Sailing Yacht',
      'Sailing Catamaran',
      'Motor Catamaran',
      'Support Yacht',
      'Expedition Yacht',
      'Passenger / Ferry (Ro-Pax)',
      'Cargo (Container / Bulk / Tanker)',
      'Offshore / Supply / DP',
      'Tug',
      'Dredger',
      'Research / Survey',
      'Training / School Ship',
      'Government / Patrol',
      'Other'
    ])
  );
