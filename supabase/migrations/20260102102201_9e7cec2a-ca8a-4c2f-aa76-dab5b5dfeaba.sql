-- Create inquiries table
CREATE TABLE public.inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  landlord_id UUID NOT NULL,
  message TEXT NOT NULL,
  reply TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  replied_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Users can view their own sent inquiries
CREATE POLICY "Users can view own inquiries"
ON public.inquiries
FOR SELECT
USING (auth.uid() = sender_id);

-- Users can create inquiries
CREATE POLICY "Users can create inquiries"
ON public.inquiries
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Landlords can view inquiries for their properties
CREATE POLICY "Landlords can view property inquiries"
ON public.inquiries
FOR SELECT
USING (auth.uid() = landlord_id);

-- Landlords can update inquiries (reply)
CREATE POLICY "Landlords can reply to inquiries"
ON public.inquiries
FOR UPDATE
USING (auth.uid() = landlord_id);

-- Admins can view all inquiries
CREATE POLICY "Admins can view all inquiries"
ON public.inquiries
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_inquiries_updated_at
BEFORE UPDATE ON public.inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for common queries
CREATE INDEX idx_inquiries_property ON public.inquiries(property_id);
CREATE INDEX idx_inquiries_sender ON public.inquiries(sender_id);
CREATE INDEX idx_inquiries_landlord ON public.inquiries(landlord_id);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);