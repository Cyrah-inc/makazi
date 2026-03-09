
-- The profiles_public view intentionally uses security definer to allow
-- cross-user reads of only non-sensitive columns (no phone, no status).
-- This is safe because the view restricts which columns are exposed.
ALTER VIEW public.profiles_public SET (security_invoker = off);
