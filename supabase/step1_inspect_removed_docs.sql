-- Paso 1: Inspección — cuántas ofertas tienen cada valor eliminado
-- Ejecutar en Supabase SQL Editor para revisar antes de migrar

WITH removed_values AS (
  SELECT unnest(ARRAY[
    'Recreational Fishing Experience',
    'Advanced / Sport Fishing',
    'Barista',
    'Drone Pilot',
    'Housekeeping',
    'Mixology / Bartender',
    'Silver Service',
    'Video Editing Skills',
    'Water Toys Experience'
  ]) AS doc_value
),
offers_with_docs AS (
  SELECT id, title, required_documents, teammate_required_documents
  FROM public.yacht_work_offers
)
SELECT
  r.doc_value,
  (SELECT count(*) FROM offers_with_docs o
   WHERE o.required_documents @> ARRAY[r.doc_value]) AS in_required_documents,
  (SELECT count(*) FROM offers_with_docs o
   WHERE o.teammate_required_documents @> ARRAY[r.doc_value]) AS in_teammate_required_documents
FROM removed_values r
ORDER BY r.doc_value;
