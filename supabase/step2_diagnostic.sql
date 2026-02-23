-- Diagnóstico: tipo de columnas y muestra de datos
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'yacht_work_offers'
  AND column_name IN ('required_documents', 'required_skills', 'teammate_required_documents');
