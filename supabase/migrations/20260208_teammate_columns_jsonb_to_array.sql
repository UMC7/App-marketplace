-- Convert teammate required_* columns from jsonb to text[] to match
-- required_licenses, required_documents, required_engineering_licenses (ARRAY type).
-- Run in Supabase → SQL Editor after 20260208_teammate_required_docs_licenses.sql.

-- Drop defaults first (jsonb '[]' cannot be cast to text[])
ALTER TABLE public.yacht_work_offers
  ALTER COLUMN teammate_required_licenses DROP DEFAULT,
  ALTER COLUMN teammate_required_engineering_licenses DROP DEFAULT,
  ALTER COLUMN teammate_required_documents DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.jsonb_to_text_array(_js jsonb)
RETURNS text[]
LANGUAGE sql
IMMUTABLE PARALLEL SAFE STRICT
AS $$
  SELECT COALESCE(
    ARRAY(SELECT jsonb_array_elements_text(_js)),
    '{}'
  );
$$;

ALTER TABLE public.yacht_work_offers
  ALTER COLUMN teammate_required_licenses
    TYPE text[] USING public.jsonb_to_text_array(teammate_required_licenses),
  ALTER COLUMN teammate_required_engineering_licenses
    TYPE text[] USING public.jsonb_to_text_array(teammate_required_engineering_licenses),
  ALTER COLUMN teammate_required_documents
    TYPE text[] USING public.jsonb_to_text_array(teammate_required_documents);

ALTER TABLE public.yacht_work_offers
  ALTER COLUMN teammate_required_licenses SET DEFAULT '{}',
  ALTER COLUMN teammate_required_engineering_licenses SET DEFAULT '{}',
  ALTER COLUMN teammate_required_documents SET DEFAULT '{}';
