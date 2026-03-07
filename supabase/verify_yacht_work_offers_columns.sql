-- Verificar columnas de yacht_work_offers (incl. is_no_visible_tattoos)
-- Ejecutar en Supabase → SQL Editor

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'yacht_work_offers'
  AND column_name IN ('is_smoke_free_yacht', 'is_dry_boat', 'is_no_visible_tattoos', 'is_random_drug_testing')
ORDER BY ordinal_position;
