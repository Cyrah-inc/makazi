
-- Drop the problematic view
DROP VIEW IF EXISTS public.profiles_public;

-- Create a security definer function for safe cross-user profile lookups
CREATE OR REPLACE FUNCTION public.get_public_profiles(user_ids uuid[])
RETURNS TABLE(user_id uuid, full_name text, avatar_url text, email text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url, p.email
  FROM public.profiles p
  WHERE p.user_id = ANY(user_ids)
$$;
