
-- Create leads table for tracking WhatsApp/Chat contact interactions
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid, -- nullable for anonymous users
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  landlord_id uuid NOT NULL,
  lead_type text NOT NULL CHECK (lead_type IN ('whatsapp', 'chat')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Admins can read all leads
CREATE POLICY "Admins can view all leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Landlords can view leads for their properties
CREATE POLICY "Landlords can view own leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (auth.uid() = landlord_id);

-- Authenticated users can insert leads
CREATE POLICY "Authenticated users can insert leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_leads_property_id ON public.leads(property_id);
CREATE INDEX idx_leads_landlord_id ON public.leads(landlord_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
