
-- Create payouts table to track landlord payout attempts
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id),
  landlord_id uuid NOT NULL,
  amount numeric NOT NULL,
  phone_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  mpesa_conversation_id text,
  mpesa_receipt text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Landlords can view own payouts"
  ON public.payouts FOR SELECT
  USING (auth.uid() = landlord_id);

CREATE POLICY "Admins can view all payouts"
  ON public.payouts FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert payouts"
  ON public.payouts FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role inserts payouts"
  ON public.payouts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role updates payouts"
  ON public.payouts FOR UPDATE
  USING (true);

-- Create admin_withdrawals table
CREATE TABLE public.admin_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  amount numeric NOT NULL,
  phone_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  mpesa_conversation_id text,
  mpesa_receipt text,
  source text NOT NULL DEFAULT 'mixed',
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.admin_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all withdrawals"
  ON public.admin_withdrawals FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert withdrawals"
  ON public.admin_withdrawals FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role updates withdrawals"
  ON public.admin_withdrawals FOR UPDATE
  USING (true);

-- Add paid_out status support: add a column to track payout_status on bookings
-- (The existing status field will gain 'paid_out' as a valid value)
