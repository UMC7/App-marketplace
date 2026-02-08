-- ============================================================
-- Revisión: ¿se guardará correctamente years_in_rank = -1
-- ("New in rank welcome") y teammate_experience = -1?
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- 1) Estructura de la tabla y tipo de las columnas
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'yacht_work_offers'
  AND column_name IN ('years_in_rank', 'teammate_experience')
ORDER BY column_name;

-- 2) Restricciones CHECK que afecten a estas columnas
--    (si hay CHECK (years_in_rank >= 0) rechazaría -1)
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.yacht_work_offers'::regclass
  AND contype = 'c';

-- 3) Prueba opcional: intentar insertar una fila de prueba con -1
--    (usa un user_id existente; descomenta y ajusta user_id si quieres probar)
/*
INSERT INTO public.yacht_work_offers (
  user_id,
  work_environment,
  title,
  years_in_rank,
  teammate_experience
) VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Onboard',
  'Test Rank',
  -1,
  -1
)
RETURNING id, years_in_rank, teammate_experience;
-- Luego borra la fila: DELETE FROM yacht_work_offers WHERE title = 'Test Rank';
*/
