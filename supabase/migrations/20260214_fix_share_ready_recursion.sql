-- Fix share_ready recursion and redundant trigger on profile_experiences
-- Root cause: apply_share_ready <-> recompute_share_ready mutual recursion.
-- Also: two triggers on profile_experiences caused duplicate recalculation.

-- 1) Drop the redundant statement-level trigger on profile_experiences
DROP TRIGGER IF EXISTS trg_recompute_share_ready_on_profile_experiences ON public.profile_experiences;

-- 2) Break the recursion by making both functions call the real compute+update
CREATE OR REPLACE FUNCTION public.apply_share_ready(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delegate to the canonical compute+update (no recursion)
  PERFORM public.rpc_recompute_share_ready(p_profile_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.recompute_share_ready(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delegate to the canonical compute+update (no recursion)
  PERFORM public.rpc_recompute_share_ready(p_profile_id);
END;
$$;
