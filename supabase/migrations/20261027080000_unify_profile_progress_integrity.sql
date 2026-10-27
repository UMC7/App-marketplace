-- Completion uses owned data, never the visibility-filtered public document RPC.
BEGIN;

CREATE OR REPLACE FUNCTION public.rpc_profile_documents_for_progress(profile_uuid uuid)
RETURNS TABLE (id uuid, title text, issued_on date, expires_on date, visibility text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.public_profiles p WHERE p.id = profile_uuid AND p.user_id = auth.uid()
    UNION ALL
    SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'not authorized to read profile progress documents' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT d.id, d.title, cert.issued_on, cert.expires_on, d.visibility
  FROM public.public_documents d
  LEFT JOIN LATERAL (
    SELECT c.issued_on, c.expires_on
    FROM public.candidate_certificates c
    WHERE c.profile_id = d.profile_id AND c.file_url = d.file_url
    ORDER BY c.id DESC
    LIMIT 1
  ) cert ON true
  WHERE d.profile_id = profile_uuid
  ORDER BY d.created_at DESC;
END;
$function$;

REVOKE ALL ON FUNCTION public.rpc_profile_documents_for_progress(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_profile_documents_for_progress(uuid) TO authenticated;

-- Keep the existing canonical Lite checks, replacing only its public visibility
-- dependency, then recalculate its final aggregate after that replacement.
CREATE OR REPLACE FUNCTION public.fn_profile_minimums_v3(profile_uuid uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_checks jsonb;
  v_docs_ok boolean;
  v_other_sections boolean;
  v_experience_ok boolean;
BEGIN
  v_checks := public.fn_profile_minimums_v2(profile_uuid);
  IF v_checks IS NULL THEN RETURN jsonb_build_object('overall_ok', false); END IF;

  SELECT count(*) >= 3 INTO v_docs_ok
  FROM public.public_documents d
  JOIN LATERAL (
    SELECT c.issued_on
    FROM public.candidate_certificates c
    WHERE c.profile_id = d.profile_id AND c.file_url = d.file_url
    ORDER BY c.id DESC
    LIMIT 1
  ) cert ON true
  WHERE d.profile_id = profile_uuid
    AND trim(coalesce(d.title, '')) <> ''
    AND cert.issued_on IS NOT NULL
    AND trim(coalesce(d.visibility, 'after_contact')) <> '';

  v_checks := jsonb_set(v_checks, '{documents,count_ge_3}', to_jsonb(coalesce(v_docs_ok, false)), true);
  SELECT NOT EXISTS (
    SELECT 1 FROM jsonb_each(v_checks - 'overall_ok' - 'experience') section,
      LATERAL jsonb_each(section.value) requirement
    WHERE jsonb_typeof(requirement.value) = 'boolean'
      AND NOT (requirement.value::text)::boolean
  ) INTO v_other_sections;
  v_experience_ok := coalesce((v_checks#>>'{experience,has_any}')::boolean, false)
    AND (coalesce((v_checks#>>'{experience,yacht_ok}')::boolean, false)
      OR coalesce((v_checks#>>'{experience,merchant_ok}')::boolean, false)
      OR coalesce((v_checks#>>'{experience,shore_ok}')::boolean, false));
  RETURN jsonb_set(v_checks, '{overall_ok}', to_jsonb(coalesce(v_other_sections, false) AND v_experience_ok), true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.rpc_recompute_share_ready(profile_uuid uuid)
RETURNS public.public_profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_ok boolean; v_row public.public_profiles;
BEGIN
  IF profile_uuid IS NULL THEN RAISE EXCEPTION 'profile_uuid is required'; END IF;
  v_ok := coalesce((public.fn_profile_minimums_v3(profile_uuid)->>'overall_ok')::boolean, false);
  UPDATE public.public_profiles
  SET share_ready = v_ok,
      updated_at = CASE WHEN share_ready IS DISTINCT FROM v_ok THEN now() ELSE updated_at END
  WHERE id = profile_uuid RETURNING * INTO v_row;
  IF NOT v_ok THEN
    UPDATE public.users SET cv_mode = 'lite'
    WHERE id = v_row.user_id AND cv_mode = 'professional';
  END IF;
  RETURN v_row;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_recompute_lite_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_profile_id uuid;
BEGIN
  v_profile_id := CASE WHEN TG_TABLE_NAME = 'public_profiles'
    THEN coalesce(NEW.id, OLD.id) ELSE coalesce(NEW.profile_id, OLD.profile_id) END;
  IF v_profile_id IS NOT NULL THEN PERFORM public.rpc_recompute_share_ready(v_profile_id); END IF;
  RETURN coalesce(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_enforce_professional_mode()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_profile_id uuid;
BEGIN
  IF NEW.cv_mode <> 'professional' OR NEW.cv_mode IS NOT DISTINCT FROM OLD.cv_mode THEN RETURN NEW; END IF;
  SELECT p.id INTO v_profile_id FROM public.public_profiles p
  WHERE p.user_id = NEW.id ORDER BY p.created_at DESC LIMIT 1;
  IF v_profile_id IS NULL OR NOT coalesce((public.fn_profile_minimums_v3(v_profile_id)->>'overall_ok')::boolean, false) THEN
    RAISE EXCEPTION 'Lite profile must be complete before Professional can be selected' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS public_profiles_recompute_share_ready_trg ON public.public_profiles;
CREATE TRIGGER public_profiles_recompute_share_ready_trg
AFTER INSERT OR UPDATE OF first_name, last_name, email_public, phone_cc, phone_number, country, city_port, birth_month, birth_year, nationalities, primary_department, primary_role, about_me, prefs_skills, prefs_skills_lite, gallery ON public.public_profiles
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_lite_progress();
DROP TRIGGER IF EXISTS public_documents_recompute_lite_progress_trg ON public.public_documents;
CREATE TRIGGER public_documents_recompute_lite_progress_trg AFTER INSERT OR UPDATE OR DELETE ON public.public_documents FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_lite_progress();
DROP TRIGGER IF EXISTS candidate_certificates_recompute_lite_progress_trg ON public.candidate_certificates;
CREATE TRIGGER candidate_certificates_recompute_lite_progress_trg AFTER INSERT OR UPDATE OR DELETE ON public.candidate_certificates FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_lite_progress();
DROP TRIGGER IF EXISTS public_references_recompute_lite_progress_trg ON public.public_references;
CREATE TRIGGER public_references_recompute_lite_progress_trg AFTER INSERT OR UPDATE OR DELETE ON public.public_references FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_lite_progress();
DROP TRIGGER IF EXISTS profile_experiences_recompute_lite_progress_trg ON public.profile_experiences;
CREATE TRIGGER profile_experiences_recompute_lite_progress_trg AFTER INSERT OR UPDATE OR DELETE ON public.profile_experiences FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_lite_progress();
DROP TRIGGER IF EXISTS users_enforce_professional_mode_trg ON public.users;
CREATE TRIGGER users_enforce_professional_mode_trg BEFORE UPDATE OF cv_mode ON public.users FOR EACH ROW EXECUTE FUNCTION public.trg_enforce_professional_mode();

COMMIT;
