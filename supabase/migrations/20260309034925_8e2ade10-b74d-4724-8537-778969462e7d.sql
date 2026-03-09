
-- Fix security definer view by setting it to invoker
ALTER VIEW public.profiles_public SET (security_invoker = on);
