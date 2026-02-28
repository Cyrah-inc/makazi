
-- Remove dangerous public policy that exposes PII (id_number, kra_pin, documents)
DROP POLICY IF EXISTS "Public can view verified landlord profiles" ON public.landlord_profiles;

-- Create safe public view exposing only necessary columns
CREATE OR REPLACE VIEW public.landlord_public_info AS
SELECT user_id, verification_status, business_phone
FROM public.landlord_profiles
WHERE verification_status = 'verified';

-- Grant access to the view
GRANT SELECT ON public.landlord_public_info TO anon, authenticated;
