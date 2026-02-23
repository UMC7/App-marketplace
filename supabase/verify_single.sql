-- Misma lógica que Step 1 para Housekeeping: debe devolver filas si Step 1 dio 44
SELECT id, title, required_documents
FROM public.yacht_work_offers
WHERE required_documents @> ARRAY['Housekeeping']
LIMIT 5;
