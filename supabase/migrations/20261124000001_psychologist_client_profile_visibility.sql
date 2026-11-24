-- ==============================================================================
-- Psychologists can read the basic profile of clients assigned to them.
-- The practice people list and coordination threads need client names; the
-- original profiles policy only allowed own-profile/admin reads, so every
-- client rendered as the "Klien Soulaide" fallback. Mirrors the existing
-- client_profiles visibility rule, scoped to the booking relationship.
-- ==============================================================================

DROP POLICY IF EXISTS "Assigned psychologists can view client basic profile" ON public."Soulaide_profiles";
CREATE POLICY "Assigned psychologists can view client basic profile"
ON public."Soulaide_profiles" FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public."Soulaide_bookings" b
    WHERE b.customer_id = public."Soulaide_profiles".id
      AND b.psychologist_id = public."Soulaide_get_psychologist_id"(auth.uid())
  )
);