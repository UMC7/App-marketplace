-- Migración alternativa con WHERE por EXISTS (más compatible)
UPDATE public.yacht_work_offers
SET
  required_skills = (
    SELECT coalesce(array_agg(DISTINCT x ORDER BY x), '{}')
    FROM (
      SELECT unnest(required_skills) AS x
      UNION
      SELECT x FROM unnest(required_documents) AS x
      WHERE x IN ('Recreational Fishing Experience', 'Advanced / Sport Fishing')
    ) sub
  ),
  required_documents = (
    SELECT coalesce(array_agg(d ORDER BY d), '{}')
    FROM unnest(required_documents) AS d
    WHERE d NOT IN (
      'Recreational Fishing Experience', 'Advanced / Sport Fishing',
      'Barista', 'Drone Pilot', 'Housekeeping', 'Mixology / Bartender',
      'Silver Service', 'Video Editing Skills', 'Water Toys Experience'
    )
  ),
  teammate_required_documents = (
    SELECT coalesce(array_agg(d ORDER BY d), '{}')
    FROM unnest(teammate_required_documents) AS d
    WHERE d NOT IN (
      'Recreational Fishing Experience', 'Advanced / Sport Fishing',
      'Barista', 'Drone Pilot', 'Housekeeping', 'Mixology / Bartender',
      'Silver Service', 'Video Editing Skills', 'Water Toys Experience'
    )
  )
WHERE EXISTS (
  SELECT 1 FROM unnest(required_documents) AS d
  WHERE d IN (
    'Recreational Fishing Experience', 'Advanced / Sport Fishing',
    'Barista', 'Drone Pilot', 'Housekeeping', 'Mixology / Bartender',
    'Silver Service', 'Video Editing Skills', 'Water Toys Experience'
  )
)
OR EXISTS (
  SELECT 1 FROM unnest(teammate_required_documents) AS d
  WHERE d IN (
    'Recreational Fishing Experience', 'Advanced / Sport Fishing',
    'Barista', 'Drone Pilot', 'Housekeeping', 'Mixology / Bartender',
    'Silver Service', 'Video Editing Skills', 'Water Toys Experience'
  )
);
