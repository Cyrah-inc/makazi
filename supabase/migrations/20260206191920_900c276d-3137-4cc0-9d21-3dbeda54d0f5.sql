
-- Create bookings table for Airbnb escrow payment system
CREATE TABLE public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL,
  landlord_id uuid NOT NULL,
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  nights integer NOT NULL,
  nightly_rate numeric NOT NULL,
  total_amount numeric NOT NULL,
  service_fee numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'mpesa',
  payment_reference text,
  payout_reference text,
  status text NOT NULL DEFAULT 'pending_payment',
  guest_phone text,
  landlord_phone text,
  checked_in_at timestamptz,
  paid_out_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Guests can create bookings (must be the guest)
CREATE POLICY "Guests can create bookings"
  ON public.bookings
  FOR INSERT
  WITH CHECK (auth.uid() = guest_id);

-- Guests can view their own bookings
CREATE POLICY "Guests can view own bookings"
  ON public.bookings
  FOR SELECT
  USING (auth.uid() = guest_id);

-- Landlords can view bookings for their properties
CREATE POLICY "Landlords can view property bookings"
  ON public.bookings
  FOR SELECT
  USING (auth.uid() = landlord_id);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
  ON public.bookings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Guests can update their own bookings (for check-in and cancellation)
CREATE POLICY "Guests can update own bookings"
  ON public.bookings
  FOR UPDATE
  USING (auth.uid() = guest_id);

-- Admins can update all bookings
CREATE POLICY "Admins can update all bookings"
  ON public.bookings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add updated_at trigger
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_bookings_guest_id ON public.bookings(guest_id);
CREATE INDEX idx_bookings_landlord_id ON public.bookings(landlord_id);
CREATE INDEX idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_check_in_date ON public.bookings(check_in_date);
