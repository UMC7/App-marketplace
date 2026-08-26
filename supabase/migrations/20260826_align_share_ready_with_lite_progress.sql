-- Keep share_ready aligned with the Lite CV requirements used by the UI.
--
-- This migration intentionally runs in safe mode: it may promote an incomplete
-- profile to Ready when it now satisfies the corrected rules, but it does not
-- automatically demote existing Ready profiles. The latter require a reviewed
-- cleanup because historical records may predate the current form validation.

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_profile_minimums_v2(profile_uuid uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_checks          jsonb;
  v_prefs           jsonb;
  v_refs_ok         boolean;
  v_docs_ok         boolean;
  v_doc_flags_ok    boolean;
  v_media_ok        boolean;
  v_other_sections  boolean;
  v_experience_ok   boolean;
  v_overall_ok      boolean;
BEGIN
  v_checks := public.fn_profile_minimums(profile_uuid);

  IF v_checks IS NULL THEN
    RETURN jsonb_build_object('overall_ok', false);
  END IF;

  SELECT coalesce(nullif(p.prefs_skills_lite, '{}'::jsonb), p.prefs_skills, '{}'::jsonb)
  INTO v_prefs
  FROM public.public_profiles p
  WHERE p.id = profile_uuid;

  -- The reference form requires identity fields and at least one contact method.
  SELECT EXISTS (
    SELECT 1
    FROM public.public_references r
    WHERE r.profile_id = profile_uuid
      AND trim(coalesce(r.name, '')) <> ''
      AND trim(coalesce(r.role, '')) <> ''
      AND trim(coalesce(r.vessel_company, '')) <> ''
      AND (
        trim(coalesce(r.phone, '')) <> ''
        OR trim(coalesce(r.email, '')) ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
      )
  ) INTO v_refs_ok;

  -- Match docsMeetMin(): three documents with title, issue date and visibility.
  SELECT count(*) >= 3
  INTO v_docs_ok
  FROM public.rpc_public_docs_with_exp(profile_uuid) d
  WHERE trim(coalesce(d.title, '')) <> ''
    AND d.issued_on IS NOT NULL
    AND trim(coalesce(d.visibility, 'unlisted')) <> '';

  -- Resident and Green Card are valid selections in the form.
  v_doc_flags_ok :=
    (v_prefs->'docFlags'->>'passport6m')     IN ('true', 'false') AND
    (v_prefs->'docFlags'->>'schengenVisa')   IN ('true', 'false', 'resident') AND
    (v_prefs->'docFlags'->>'stcwBasic')      IN ('true', 'false') AND
    (v_prefs->'docFlags'->>'seamansBook')    IN ('true', 'false') AND
    (v_prefs->'docFlags'->>'eng1')           IN ('true', 'false') AND
    (v_prefs->'docFlags'->>'usVisa')         IN ('true', 'false', 'green_card') AND
    (v_prefs->'docFlags'->>'drivingLicense') IN ('true', 'false') AND
    (v_prefs->'docFlags'->>'pdsd')           IN ('true', 'false') AND
    (v_prefs->'docFlags'->>'covidVaccine')   IN ('true', 'false');

  -- Videos do not count toward the minimum of three photos.
  SELECT count(*) >= 3
  INTO v_media_ok
  FROM public.public_profiles p
  CROSS JOIN LATERAL jsonb_array_elements(coalesce(p.gallery, '[]'::jsonb)) item
  WHERE p.id = profile_uuid
    AND (
      lower(coalesce(item->>'type', '')) = 'image'
      OR (
        trim(coalesce(item->>'type', '')) = ''
        AND coalesce(item->>'name', item->>'path', item->>'url', '')
              !~* '\.(mp4|webm|mov|m4v|avi|mkv)(\?.*)?$'
      )
    );

  v_checks := jsonb_set(v_checks, '{references,has_any}', to_jsonb(coalesce(v_refs_ok, false)), true);
  v_checks := jsonb_set(v_checks, '{documents,count_ge_3}', to_jsonb(coalesce(v_docs_ok, false)), true);
  v_checks := jsonb_set(v_checks, '{documents,doc_flags}', to_jsonb(coalesce(v_doc_flags_ok, false)), true);
  v_checks := jsonb_set(v_checks, '{media,count_ge_3}', to_jsonb(coalesce(v_media_ok, false)), true);

  -- Every boolean leaf outside experience must pass. Experience is special:
  -- at least one row must exist and one supported experience type must be valid.
  SELECT NOT EXISTS (
    SELECT 1
    FROM jsonb_each(v_checks - 'overall_ok' - 'experience') section,
         LATERAL jsonb_each(section.value) requirement
    WHERE jsonb_typeof(requirement.value) = 'boolean'
      AND NOT (requirement.value::text)::boolean
  ) INTO v_other_sections;

  v_experience_ok :=
    coalesce((v_checks#>>'{experience,has_any}')::boolean, false)
    AND (
      coalesce((v_checks#>>'{experience,yacht_ok}')::boolean, false)
      OR coalesce((v_checks#>>'{experience,merchant_ok}')::boolean, false)
      OR coalesce((v_checks#>>'{experience,shore_ok}')::boolean, false)
    );

  v_overall_ok := coalesce(v_other_sections, false) AND coalesce(v_experience_ok, false);
  RETURN jsonb_set(v_checks, '{overall_ok}', to_jsonb(v_overall_ok), true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_recompute_share_ready(profile_uuid uuid)
RETURNS public.public_profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_checks jsonb;
  v_ok     boolean;
  v_row    public.public_profiles;
BEGIN
  IF profile_uuid IS NULL THEN
    RAISE EXCEPTION 'profile_uuid is required';
  END IF;

  v_checks := public.fn_profile_minimums_v2(profile_uuid);
  v_ok := coalesce((v_checks->>'overall_ok')::boolean, false);

  -- Safe rollout: upgrade valid profiles; preserve historical Ready profiles.
  UPDATE public.public_profiles
  SET share_ready = CASE WHEN v_ok THEN true ELSE share_ready END,
      updated_at = CASE
        WHEN v_ok AND share_ready IS DISTINCT FROM true THEN now()
        ELSE updated_at
      END
  WHERE id = profile_uuid
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recompute_share_ready_by_profile(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_profile_id IS NOT NULL THEN
    PERFORM public.rpc_recompute_share_ready(p_profile_id);
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.recompute_share_ready_by_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile_id uuid;
BEGIN
  SELECT p.id
  INTO v_profile_id
  FROM public.public_profiles p
  WHERE p.user_id = p_user_id
  ORDER BY p.created_at DESC
  LIMIT 1;

  IF v_profile_id IS NOT NULL THEN
    PERFORM public.rpc_recompute_share_ready(v_profile_id);
  END IF;
END;
$function$;

DROP TRIGGER IF EXISTS public_profiles_recompute_share_ready_trg ON public.public_profiles;
CREATE TRIGGER public_profiles_recompute_share_ready_trg
AFTER INSERT OR UPDATE OF
  first_name,
  last_name,
  email_public,
  phone_cc,
  phone_number,
  country,
  city_port,
  birth_month,
  birth_year,
  nationalities,
  primary_department,
  primary_role,
  about_me,
  prefs_skills,
  prefs_skills_lite,
  gallery
ON public.public_profiles
FOR EACH ROW
EXECUTE FUNCTION public.trg_public_profiles_recompute_share_ready();

-- These statement-level triggers cannot identify the affected row. The existing
-- row-level triggers on documents/references handle the recalculation correctly.
DROP TRIGGER IF EXISTS trg_recompute_share_ready_on_candidate_certificates
  ON public.candidate_certificates;
DROP TRIGGER IF EXISTS trg_recompute_share_ready_on_public_documents
  ON public.public_documents;
DROP TRIGGER IF EXISTS trg_recompute_share_ready_on_public_references
  ON public.public_references;

COMMIT;
