-- Diagnóstico de completitud del perfil para Ryan
-- User ID: 07158cc0-bd35-4723-8a52-da108e213790
-- Ejecutar en Supabase SQL Editor

DO $$
DECLARE
  v_user_id uuid := '07158cc0-bd35-4723-8a52-da108e213790';
  v_profile_id uuid;
  v_prefs jsonb;
  v_lh jsonb;
  v_doc_flags jsonb;
  v_gallery jsonb;
  v_personal_ok int := 0;
  v_personal_total int := 10;
  v_dept_ok int := 0;
  v_dept_total int := 2;
  v_exp_count int;
  v_edu_count int;
  v_refs_count int;
  v_docs_valid int;
  v_doc_flags_ok int;
  v_gallery_images int := 0;
  v_msg text := '';
BEGIN
  -- Obtener profile
  SELECT id, prefs_skills_lite, gallery
  INTO v_profile_id, v_prefs, v_gallery
  FROM public_profiles
  WHERE user_id = v_user_id;

  IF v_profile_id IS NULL THEN
    RAISE NOTICE '❌ No se encontró perfil para user_id %', v_user_id;
    RETURN;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '  DIAGNÓSTICO DE COMPLETITUD - Ryan (user_id: %)', v_user_id;
  RAISE NOTICE '═══════════════════════════════════════════════';
  RAISE NOTICE '';

  -- 1. PERSONAL (10 campos en Lite)
  SELECT
    (CASE WHEN trim(coalesce(first_name,'')) <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN trim(coalesce(last_name,'')) <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN email_public ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' THEN 1 ELSE 0 END) +
    (CASE WHEN regexp_replace(coalesce(phone_cc,''), '\D', '', 'g') <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN trim(coalesce(phone_number,'')) <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN country IS NOT NULL AND country::text <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN trim(coalesce(city_port,'')) <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN birth_month IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN birth_year IS NOT NULL THEN 1 ELSE 0 END) +
    (CASE WHEN jsonb_array_length(coalesce(nationalities,'[]'::jsonb)) > 0 THEN 1 ELSE 0 END)
  INTO v_personal_ok
  FROM public_profiles
  WHERE id = v_profile_id;

  IF v_personal_ok < v_personal_total THEN
    RAISE NOTICE '1. PERSONAL: %/10 ❌ FALTA', v_personal_ok;
    RAISE NOTICE '   Revisar: first_name, last_name, email_public, phone_cc, phone_number, country, city_port, birth_month, birth_year, nationalities';
  ELSE
    RAISE NOTICE '1. PERSONAL: 10/10 ✓';
  END IF;

  -- 2. DEPT & RANK
  SELECT
    (CASE WHEN trim(coalesce(primary_department,'')) <> '' THEN 1 ELSE 0 END) +
    (CASE WHEN trim(coalesce(primary_role,'')) <> '' THEN 1 ELSE 0 END)
  INTO v_dept_ok
  FROM public_profiles
  WHERE id = v_profile_id;

  IF v_dept_ok < v_dept_total THEN
    RAISE NOTICE '2. DEPT & RANK: %/2 ❌ FALTA (primary_department, primary_role)', v_dept_ok;
  ELSE
    RAISE NOTICE '2. DEPT & RANK: 2/2 ✓';
  END IF;

  -- 3. EXPERIENCE
  SELECT count(*) INTO v_exp_count FROM profile_experiences WHERE profile_id = v_profile_id;
  IF v_exp_count < 1 THEN
    RAISE NOTICE '3. EXPERIENCE: 0 ❌ FALTA (mínimo 1)';
  ELSE
    RAISE NOTICE '3. EXPERIENCE: % ✓', v_exp_count;
  END IF;

  -- 4. ABOUT ME
  IF (SELECT trim(coalesce(about_me,'')) FROM public_profiles WHERE id = v_profile_id) = '' THEN
    RAISE NOTICE '4. ABOUT ME: ❌ FALTA (about_me vacío)';
  ELSE
    RAISE NOTICE '4. ABOUT ME: ✓';
  END IF;

  -- 5. LIFESTYLE
  v_lh := coalesce(v_prefs->'lifestyleHabits', '{}'::jsonb);
  IF (
    trim(coalesce(v_lh->>'tattoosVisible','')) = '' OR
    trim(coalesce(v_lh->>'smoking','')) = '' OR
    trim(coalesce(v_lh->>'vaping','')) = '' OR
    trim(coalesce(v_lh->>'alcohol','')) = '' OR
    coalesce(jsonb_array_length(v_lh->'dietaryAllergies'), 0) = 0 OR
    trim(coalesce(v_lh->>'fitness','')) = ''
  ) THEN
    RAISE NOTICE '5. LIFESTYLE: ❌ FALTA';
    RAISE NOTICE '   tattoosVisible: %', coalesce(v_lh->>'tattoosVisible', '(vacío)');
    RAISE NOTICE '   smoking: %', coalesce(v_lh->>'smoking', '(vacío)');
    RAISE NOTICE '   vaping: %', coalesce(v_lh->>'vaping', '(vacío)');
    RAISE NOTICE '   alcohol: %', coalesce(v_lh->>'alcohol', '(vacío)');
    RAISE NOTICE '   dietaryAllergies (length): %', coalesce(jsonb_array_length(v_lh->'dietaryAllergies'), 0);
    RAISE NOTICE '   fitness: %', coalesce(v_lh->>'fitness', '(vacío)');
  ELSE
    RAISE NOTICE '5. LIFESTYLE: 6/6 ✓';
  END IF;

  -- 6. PREFS & SKILLS (Lite: status, availability, languageLevels, deptSpecialties)
  IF (
    trim(coalesce(v_prefs->>'status','')) = '' OR
    trim(coalesce(v_prefs->>'availability','')) = '' OR
    coalesce(jsonb_array_length(v_prefs->'languageLevels'), 0) = 0 OR
    coalesce(jsonb_array_length(v_prefs->'deptSpecialties'), 0) = 0
  ) THEN
    RAISE NOTICE '6. PREFS & SKILLS: ❌ FALTA';
    RAISE NOTICE '   status: %', coalesce(v_prefs->>'status', '(vacío)');
    RAISE NOTICE '   availability: %', coalesce(v_prefs->>'availability', '(vacío)');
    RAISE NOTICE '   languageLevels: %', coalesce(jsonb_array_length(v_prefs->'languageLevels'), 0);
    RAISE NOTICE '   deptSpecialties: %', coalesce(jsonb_array_length(v_prefs->'deptSpecialties'), 0);
  ELSE
    RAISE NOTICE '6. PREFS & SKILLS: ✓';
  END IF;

  -- 7. EDUCATION
  SELECT count(*) INTO v_edu_count FROM cv_education WHERE user_id = v_user_id;
  IF v_edu_count < 1 THEN
    RAISE NOTICE '7. EDUCATION: 0 ❌ FALTA (mínimo 1)';
  ELSE
    RAISE NOTICE '7. EDUCATION: % ✓', v_edu_count;
  END IF;

  -- 8. DOCUMENTS (mín 3 con title + issued_on) + docFlags (9 boolean)
  SELECT count(*) INTO v_docs_valid
  FROM public_documents d
  INNER JOIN candidate_certificates c ON c.profile_id = d.profile_id AND c.file_url = d.file_url AND c.issued_on IS NOT NULL
  WHERE d.profile_id = v_profile_id
    AND trim(coalesce(d.title,'')) <> '';

  v_doc_flags := coalesce(v_prefs->'docFlags', '{}'::jsonb);
  v_doc_flags_ok := (
    CASE WHEN (v_doc_flags->>'passport6m')::text IN ('true','false') THEN 1 ELSE 0 END +
    CASE WHEN (v_doc_flags->>'schengenVisa')::text IN ('true','false') THEN 1 ELSE 0 END +
    CASE WHEN (v_doc_flags->>'stcwBasic')::text IN ('true','false') THEN 1 ELSE 0 END +
    CASE WHEN (v_doc_flags->>'seamansBook')::text IN ('true','false') THEN 1 ELSE 0 END +
    CASE WHEN (v_doc_flags->>'eng1')::text IN ('true','false') THEN 1 ELSE 0 END +
    CASE WHEN (v_doc_flags->>'usVisa')::text IN ('true','false') THEN 1 ELSE 0 END +
    CASE WHEN (v_doc_flags->>'drivingLicense')::text IN ('true','false') THEN 1 ELSE 0 END +
    CASE WHEN (v_doc_flags->>'pdsd')::text IN ('true','false') THEN 1 ELSE 0 END +
    CASE WHEN (v_doc_flags->>'covidVaccine')::text IN ('true','false') THEN 1 ELSE 0 END
  );

  IF v_docs_valid < 3 THEN
    RAISE NOTICE '8. DOCUMENTS: docs válidos=% (<3) ❌ FALTA', v_docs_valid;
  ELSE
    RAISE NOTICE '8. DOCUMENTS: docs válidos=% ✓', v_docs_valid;
  END IF;
  IF v_doc_flags_ok < 9 THEN
    RAISE NOTICE '   docFlags: %/9 ❌ FALTA (todos deben ser boolean)', v_doc_flags_ok;
  ELSE
    RAISE NOTICE '   docFlags: 9/9 ✓';
  END IF;

  -- 9. REFERENCES
  SELECT count(*) INTO v_refs_count FROM public_references WHERE profile_id = v_profile_id;
  IF v_refs_count < 1 THEN
    RAISE NOTICE '9. REFERENCES: 0 ❌ FALTA (mínimo 1)';
  ELSE
    RAISE NOTICE '9. REFERENCES: % ✓', v_refs_count;
  END IF;

  -- 10. GALLERY (solo imágenes, mín 3; excluir vídeos por extensión)
  IF v_gallery IS NOT NULL AND jsonb_typeof(v_gallery) = 'array' THEN
    SELECT count(*) INTO v_gallery_images
    FROM jsonb_array_elements(v_gallery) el
    WHERE coalesce(el->>'path', el->>'name', '') !~* '\.(mp4|webm|mov|m4v|avi|mkv)$';
  END IF;
  IF v_gallery_images < 3 THEN
    RAISE NOTICE '10. PHOTOS: % imágenes (<3) ❌ FALTA', coalesce(v_gallery_images, 0);
  ELSE
    RAISE NOTICE '10. PHOTOS: % ✓', v_gallery_images;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════';
END $$;
