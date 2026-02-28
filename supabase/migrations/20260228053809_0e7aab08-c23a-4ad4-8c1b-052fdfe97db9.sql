
-- Fix the security definer view warning by making it security invoker
-- But since we need public access and RLS is now restrictive, we use a function instead
DROP VIEW IF EXISTS public.landlord_public_info;

-- Recreate with SECURITY INVOKER (Postgres 15+)
CREATE OR REPLACE VIEW public.landlord_public_info 
WITH (security_invoker = true) AS
SELECT user_id, verification_status, business_phone
FROM public.landlord_profiles
WHERE verification_status = 'verified';

-- We need a permissive policy for this view to work via security invoker
-- Add a minimal public read policy that only allows reading verified landlord profiles
CREATE POLICY "Public can view verified landlord basic info"
ON public.landlord_profiles
FOR SELECT
USING (verification_status = 'verified');

GRANT SELECT ON public.landlord_public_info TO anon, authenticated;
