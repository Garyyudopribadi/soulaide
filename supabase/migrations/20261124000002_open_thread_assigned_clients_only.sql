-- ==============================================================================
-- Psychologist-initiated threads are limited to assigned clients.
-- Soulaide_open_thread(p_customer_id) previously let any psychologist open a
-- coordination thread with any client, even without a booking relationship.
-- The practice people list only shows assigned clients; the RPC now enforces
-- the same boundary server-side.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public."Soulaide_open_thread"(
  p_psychologist_id UUID DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_caller_psych_id UUID;
  v_conversation_id UUID;
  v_kind TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  v_caller_psych_id := public."Soulaide_get_psychologist_id"(v_uid);

  IF v_caller_psych_id IS NOT NULL AND p_customer_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public."Soulaide_bookings" b
      WHERE b.customer_id = p_customer_id
        AND b.psychologist_id = v_caller_psych_id
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Klien ini tidak terkait dengan praktik Anda');
    END IF;
    v_kind := 'psychologist';
    v_conversation_id := public."Soulaide_find_or_create_thread"(p_customer_id, v_caller_psych_id, 'psychologist');
  ELSIF p_psychologist_id IS NOT NULL THEN
    v_kind := 'psychologist';
    v_conversation_id := public."Soulaide_find_or_create_thread"(v_uid, p_psychologist_id, 'psychologist');
  ELSE
    v_kind := 'assistant';
    v_conversation_id := public."Soulaide_find_or_create_thread"(v_uid, NULL, 'assistant');
  END IF;

  RETURN jsonb_build_object('success', true, 'conversation_id', v_conversation_id, 'kind', v_kind);
END;
$$;