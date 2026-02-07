
-- ============================================================
-- 1. landlord_profiles table
-- ============================================================
CREATE TABLE public.landlord_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  id_number text,
  kra_pin text,
  business_phone text,
  documents text[] DEFAULT '{}'::text[],
  verification_status text NOT NULL DEFAULT 'unverified',
  verification_notes text,
  verified_at timestamptz,
  verified_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.landlord_profiles ENABLE ROW LEVEL SECURITY;

-- Landlord can view own profile
CREATE POLICY "Landlords can view own landlord profile"
  ON public.landlord_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Landlord can insert own profile
CREATE POLICY "Landlords can insert own landlord profile"
  ON public.landlord_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Landlord can update own profile
CREATE POLICY "Landlords can update own landlord profile"
  ON public.landlord_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all landlord profiles
CREATE POLICY "Admins can view all landlord profiles"
  ON public.landlord_profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all landlord profiles (for verification)
CREATE POLICY "Admins can update all landlord profiles"
  ON public.landlord_profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_landlord_profiles_updated_at
  BEFORE UPDATE ON public.landlord_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. subscriptions table
-- ============================================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'expired',
  plan text NOT NULL DEFAULT 'basic',
  amount numeric NOT NULL DEFAULT 2000,
  payment_method text,
  payment_reference text,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Landlords can view own subscription
CREATE POLICY "Landlords can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Landlords can insert own subscription
CREATE POLICY "Landlords can insert own subscription"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Landlords can update own subscription
CREATE POLICY "Landlords can update own subscription"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all subscriptions
CREATE POLICY "Admins can update all subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. landlord-documents storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('landlord-documents', 'landlord-documents', true);

-- Landlords can upload to their own folder
CREATE POLICY "Landlords can upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'landlord-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Landlords can view own documents
CREATE POLICY "Landlords can view own documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'landlord-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Landlords can delete own documents
CREATE POLICY "Landlords can delete own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'landlord-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Admins can view all documents
CREATE POLICY "Admins can view all landlord documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'landlord-documents'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- ============================================================
-- 4. Auto-create landlord_profiles when a landlord role is assigned
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_landlord_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'landlord' THEN
    INSERT INTO public.landlord_profiles (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_landlord_role_created
  AFTER INSERT ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_landlord_profile();
