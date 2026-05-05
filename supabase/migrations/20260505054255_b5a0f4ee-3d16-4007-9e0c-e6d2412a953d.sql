
-- 1. Remove email exposure from get_public_profiles
DROP FUNCTION IF EXISTS public.get_public_profiles(uuid[]);
CREATE OR REPLACE FUNCTION public.get_public_profiles(user_ids uuid[])
RETURNS TABLE(user_id uuid, full_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.avatar_url
  FROM public.profiles p
  WHERE p.user_id = ANY(user_ids)
$$;

-- 2. Revoke broad EXECUTE on SECURITY DEFINER helpers; only allow needed callers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM anon;

-- 3. Tighten storage upload policy on property-images to enforce folder ownership
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. Tighten leads INSERT: require either anon-with-null-user_id is disallowed; user_id matches caller when present
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
CREATE POLICY "Authenticated users can insert leads"
ON public.leads FOR INSERT TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 5. Realtime: restrict topic subscription to the owning user (topic must equal a UUID belonging to caller)
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read own user-topic messages" ON realtime.messages;
CREATE POLICY "Authenticated can read own user-topic messages"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() = ('user:' || (auth.uid())::text)
  OR realtime.topic() = ('notifications:' || (auth.uid())::text)
  OR realtime.topic() = (auth.uid())::text
);
