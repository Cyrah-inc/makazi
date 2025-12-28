-- Add status field to profiles for account suspension
ALTER TABLE public.profiles 
ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending'));

-- Create index for faster status filtering
CREATE INDEX idx_profiles_status ON public.profiles(status);