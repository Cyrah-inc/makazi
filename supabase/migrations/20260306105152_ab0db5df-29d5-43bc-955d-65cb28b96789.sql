-- Allow all authenticated users to view profiles (name, avatar)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

-- Allow all authenticated users to check subscription status
CREATE POLICY "Authenticated users can view subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (true);