CREATE POLICY "Public can view verified landlord profiles"
  ON landlord_profiles FOR SELECT
  USING (verification_status = 'verified');