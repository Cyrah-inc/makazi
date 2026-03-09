
-- Create a public profiles view with only non-sensitive columns
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT user_id, full_name, avatar_url, email
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;
