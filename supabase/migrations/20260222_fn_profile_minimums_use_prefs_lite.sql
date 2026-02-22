-- fn_profile_minimums: share_ready = Lite 100% → usar SOLO prefs_skills_lite
-- Bug: perfiles Lite guardan en prefs_skills_lite, pero la función solo leía prefs_skills
-- Lite y Professional están separados; el progreso de cada uno es independiente.
-- share_ready desbloquea Professional → evalúa únicamente criterios Lite.

CREATE OR REPLACE FUNCTION public.fn_profile_minimums(profile_uuid uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
AS $function$
WITH p AS (
  SELECT *
  FROM public.public_profiles
  WHERE id = profile_uuid
),
-- Prefs para Lite: prefs_skills_lite; si vacío, fallback a prefs_skills (legacy)
prefs_lite AS (
  SELECT coalesce(
    nullif((SELECT prefs_skills_lite FROM p), '{}'::jsonb),
    (SELECT prefs_skills FROM p)
  ) AS prefs
  FROM p
),
-- --------- Sección: Personal details ----------
personal_ok AS (
  SELECT
    (trim(coalesce(first_name, '')) <> '')                       AS first_name_ok,
    (trim(coalesce(last_name, ''))  <> '')                       AS last_name_ok,
    (trim(coalesce(email_public, '')) ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') AS email_ok,
    (trim(coalesce(phone_cc, '')) <> '')                         AS phone_cc_ok,
    (trim(coalesce(phone_number, '')) <> '')                     AS phone_num_ok,
    (trim(coalesce(country, '')) <> '')                          AS country_ok,
    (trim(coalesce(city_port, '')) <> '')                        AS city_port_ok,
    (birth_month IS NOT NULL)                                    AS birth_month_ok,
    (birth_year  IS NOT NULL)                                    AS birth_year_ok,
    (coalesce(array_length(nationalities,1),0) > 0)              AS nationalities_ok
  FROM p
),
-- --------- Sección: Dept & Ranks ----------
dept_ranks_ok AS (
  SELECT
    (trim(coalesce(primary_department,'')) <> '') AS primary_dept_ok,
    (trim(coalesce(primary_role,''))       <> '') AS primary_role_ok
  FROM p
),
-- --------- Sección: Experience ----------
xp_yacht_ok AS (
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_experiences x
    WHERE x.profile_id = (SELECT id FROM p)
      AND x.kind = 'yacht'
      AND trim(coalesce(x.department,'')) <> ''
      AND trim(coalesce(x.role,'')) <> ''
      AND trim(coalesce(x.vessel_name,'')) <> ''
      AND trim(coalesce(x.vessel_type,'')) <> ''
      AND x.loa_m IS NOT NULL
      AND x.start_year IS NOT NULL AND x.start_month IS NOT NULL
      AND (x.is_current = true OR (x.end_year IS NOT NULL AND x.end_month IS NOT NULL))
      AND coalesce(array_length(x.regions,1),0) > 0
      AND trim(coalesce(x.mode,'')) <> ''
      AND trim(coalesce((x.extras->>'contract')::text,'')) <> ''
  ) AS ok
),
xp_merchant_ok AS (
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_experiences x
    WHERE x.profile_id = (SELECT id FROM p)
      AND x.kind = 'merchant'
      AND trim(coalesce(x.department,'')) <> ''
      AND trim(coalesce(x.role,'')) <> ''
      AND trim(coalesce(x.vessel_name,'')) <> ''
      AND trim(coalesce(x.vessel_type,'')) <> ''
      AND (x.loa_m IS NOT NULL)
      AND x.start_year IS NOT NULL AND x.start_month IS NOT NULL
      AND (x.is_current = true OR (x.end_year IS NOT NULL AND x.end_month IS NOT NULL))
      AND coalesce(array_length(x.regions,1),0) > 0
      AND trim(coalesce((x.extras->>'contract')::text,'')) <> ''
      AND trim(coalesce((x.extras->>'employer_name')::text,'')) <> ''
  ) AS ok
),
xp_shore_ok AS (
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_experiences x
    WHERE x.profile_id = (SELECT id FROM p)
      AND x.kind = 'shore'
      AND trim(coalesce(x.vessel_name,'')) <> ''
      AND trim(coalesce(x.role,'')) <> ''
      AND trim(coalesce((x.extras->>'contract')::text,'')) <> ''
      AND (
        trim(coalesce((x.extras->>'industry')::text,'')) <> '' OR
        trim(coalesce(x.vessel_type,'')) <> ''
      )
      AND trim(coalesce((x.extras->>'location_country')::text,'')) <> ''
      AND x.start_year IS NOT NULL AND x.start_month IS NOT NULL
      AND (x.is_current = true OR (x.end_year IS NOT NULL AND x.end_month IS NOT NULL))
  ) AS ok
),
xp_any_ok AS (
  SELECT EXISTS (
    SELECT 1 FROM public.profile_experiences x
    WHERE x.profile_id = (SELECT id FROM p)
  ) AS has_any
),
-- --------- Sección: About me ----------
about_ok AS (
  SELECT (trim(coalesce(about_me,'')) <> '') AS ok FROM p
),
-- --------- Sección: Preferences & Skills (solo Lite: prefs_skills_lite) ----------
prefs_ok AS (
  SELECT
    (trim(coalesce((SELECT prefs->>'status' FROM prefs_lite), '')) <> '')       AS status_ok,
    (trim(coalesce((SELECT prefs->>'availability' FROM prefs_lite), '')) <> '') AS availability_ok,
    EXISTS (
      SELECT 1
      FROM jsonb_array_elements(coalesce((SELECT prefs->'languageLevels' FROM prefs_lite), '[]'::jsonb)) el
      WHERE trim(coalesce(el->>'lang','')) <> ''
        AND trim(coalesce(el->>'level', el->>'proficiency','')) <> ''
    ) AS lang_prof_ok,
    COALESCE(jsonb_array_length(coalesce((SELECT prefs->'deptSpecialties' FROM prefs_lite), '[]'::jsonb)), 0) > 0 AS dept_skills_ok
  FROM p
),
-- --------- Sección: Lifestyle (solo Lite: prefs_skills_lite) ----------
lifestyle_ok AS (
  SELECT
    (trim(coalesce((SELECT prefs->'lifestyleHabits'->>'tattoosVisible' FROM prefs_lite), '')) <> '') AS tattoos_ok,
    COALESCE(jsonb_array_length(coalesce((SELECT prefs->'lifestyleHabits'->'dietaryAllergies' FROM prefs_lite), '[]'::jsonb)), 0) > 0 AS allergies_ok,
    (trim(coalesce((SELECT prefs->'lifestyleHabits'->>'fitness' FROM prefs_lite), '')) <> '') AS fitness_ok
  FROM p
),
-- --------- Sección: Education ----------
edu_ok AS (
  SELECT EXISTS (
    SELECT 1 FROM public.cv_education e
    WHERE e.user_id = (SELECT user_id FROM p)
  ) AS ok
),
-- --------- Sección: Documents (docFlags solo Lite: prefs_skills_lite) ----------
doc_flags_ok AS (
  SELECT
    ((SELECT prefs->'docFlags'->>'passport6m' FROM prefs_lite)     IN ('true','false')) AND
    ((SELECT prefs->'docFlags'->>'schengenVisa' FROM prefs_lite)   IN ('true','false')) AND
    ((SELECT prefs->'docFlags'->>'stcwBasic' FROM prefs_lite)      IN ('true','false')) AND
    ((SELECT prefs->'docFlags'->>'seamansBook' FROM prefs_lite)    IN ('true','false')) AND
    ((SELECT prefs->'docFlags'->>'eng1' FROM prefs_lite)           IN ('true','false')) AND
    ((SELECT prefs->'docFlags'->>'usVisa' FROM prefs_lite)         IN ('true','false')) AND
    ((SELECT prefs->'docFlags'->>'drivingLicense' FROM prefs_lite) IN ('true','false')) AND
    ((SELECT prefs->'docFlags'->>'pdsd' FROM prefs_lite)            IN ('true','false')) AND
    ((SELECT prefs->'docFlags'->>'covidVaccine' FROM prefs_lite)   IN ('true','false'))
    AS ok
  FROM p
),
docs_count AS (
  SELECT COUNT(*)::int AS cnt
  FROM public.public_documents d
  WHERE d.profile_id = (SELECT id FROM p)
),
docs_min_ok AS (
  SELECT (cnt >= 3) AS ok FROM docs_count
),
-- --------- Sección: References ----------
refs_ok AS (
  SELECT EXISTS (
    SELECT 1
    FROM public.public_references r
    WHERE r.profile_id = (SELECT id FROM p)
      AND trim(coalesce(r.name,'')) <> ''
      AND trim(coalesce(r.role,'')) <> ''
      AND trim(coalesce(r.vessel_company,'')) <> ''
      AND trim(coalesce(r.phone,'')) <> ''
      AND trim(coalesce(r.email,'')) <> ''
  ) AS ok
),
-- --------- Sección: Media ----------
media_ok AS (
  SELECT COALESCE(jsonb_array_length(coalesce(gallery,'[]'::jsonb)), 0) >= 3 AS ok
  FROM p
)
SELECT jsonb_build_object(
  'personal', jsonb_build_object(
    'first_name',       (SELECT first_name_ok     FROM personal_ok),
    'last_name',        (SELECT last_name_ok      FROM personal_ok),
    'email',            (SELECT email_ok          FROM personal_ok),
    'phone_cc',         (SELECT phone_cc_ok       FROM personal_ok),
    'phone_number',     (SELECT phone_num_ok      FROM personal_ok),
    'country',          (SELECT country_ok        FROM personal_ok),
    'city_port',        (SELECT city_port_ok      FROM personal_ok),
    'birth_month',      (SELECT birth_month_ok    FROM personal_ok),
    'birth_year',       (SELECT birth_year_ok     FROM personal_ok),
    'nationalities',    (SELECT nationalities_ok  FROM personal_ok)
  ),
  'dept_ranks', jsonb_build_object(
    'primary_department', (SELECT primary_dept_ok FROM dept_ranks_ok),
    'primary_rank',       (SELECT primary_role_ok FROM dept_ranks_ok)
  ),
  'experience', jsonb_build_object(
    'has_any',   (SELECT has_any FROM xp_any_ok),
    'yacht_ok',  (SELECT ok FROM xp_yacht_ok),
    'merchant_ok',(SELECT ok FROM xp_merchant_ok),
    'shore_ok',  (SELECT ok FROM xp_shore_ok)
  ),
  'about_me', jsonb_build_object(
    'short_summary', (SELECT ok FROM about_ok)
  ),
  'prefs_skills', jsonb_build_object(
    'status',          (SELECT status_ok      FROM prefs_ok),
    'availability',    (SELECT availability_ok FROM prefs_ok),
    'languages_prof',  (SELECT lang_prof_ok    FROM prefs_ok),
    'dept_skills',     (SELECT dept_skills_ok  FROM prefs_ok)
  ),
  'lifestyle', jsonb_build_object(
    'tattoos_visible',   (SELECT tattoos_ok   FROM lifestyle_ok),
    'dietary_allergies', (SELECT allergies_ok FROM lifestyle_ok),
    'fitness',           (SELECT fitness_ok   FROM lifestyle_ok)
  ),
  'education', jsonb_build_object(
    'has_any', (SELECT ok FROM edu_ok)
  ),
  'documents', jsonb_build_object(
    'doc_flags', (SELECT ok FROM doc_flags_ok),
    'count_ge_3',(SELECT ok FROM docs_min_ok)
  ),
  'references', jsonb_build_object(
    'has_any', (SELECT ok FROM refs_ok)
  ),
  'media', jsonb_build_object(
    'count_ge_3', (SELECT ok FROM media_ok)
  ),
  'overall_ok',
    (
      (SELECT first_name_ok     FROM personal_ok) AND
      (SELECT last_name_ok      FROM personal_ok) AND
      (SELECT email_ok          FROM personal_ok) AND
      (SELECT phone_cc_ok       FROM personal_ok) AND
      (SELECT phone_num_ok      FROM personal_ok) AND
      (SELECT country_ok        FROM personal_ok) AND
      (SELECT city_port_ok      FROM personal_ok) AND
      (SELECT birth_month_ok    FROM personal_ok) AND
      (SELECT birth_year_ok     FROM personal_ok) AND
      (SELECT nationalities_ok  FROM personal_ok) AND

      (SELECT primary_dept_ok   FROM dept_ranks_ok) AND
      (SELECT primary_role_ok   FROM dept_ranks_ok) AND

      (SELECT has_any FROM xp_any_ok) AND
      (
        (SELECT ok FROM xp_yacht_ok) OR
        (SELECT ok FROM xp_merchant_ok) OR
        (SELECT ok FROM xp_shore_ok)
      ) AND

      (SELECT ok FROM about_ok) AND

      (SELECT status_ok FROM prefs_ok) AND
      (SELECT availability_ok FROM prefs_ok) AND
      (SELECT lang_prof_ok FROM prefs_ok) AND
      (SELECT dept_skills_ok FROM prefs_ok) AND

      (SELECT tattoos_ok FROM lifestyle_ok) AND
      (SELECT allergies_ok FROM lifestyle_ok) AND
      (SELECT fitness_ok FROM lifestyle_ok) AND

      (SELECT ok FROM edu_ok) AND

      (SELECT ok FROM doc_flags_ok) AND
      (SELECT ok FROM docs_min_ok) AND

      (SELECT ok FROM refs_ok) AND

      (SELECT ok FROM media_ok)
    )
) AS result;
$function$;
