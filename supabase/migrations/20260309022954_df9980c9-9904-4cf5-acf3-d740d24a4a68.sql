
-- Allow authenticated users (not just landlords) to insert their own landlord_profiles row
CREATE POLICY "Authenticated users can insert own landlord profile"
ON public.landlord_profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to select their own landlord_profiles row
CREATE POLICY "Authenticated users can view own landlord profile"
ON public.landlord_profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to update their own landlord_profiles row
CREATE POLICY "Authenticated users can update own landlord profile"
ON public.landlord_profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
