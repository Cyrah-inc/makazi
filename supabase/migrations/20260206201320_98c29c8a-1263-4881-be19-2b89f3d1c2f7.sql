
-- Create reviews table for guest reviews after staying
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL UNIQUE,
  property_id uuid NOT NULL,
  guest_id uuid NOT NULL,
  landlord_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add foreign key to bookings
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

-- Add foreign key to properties
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.properties(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Guests can create a review for their own checked_in/completed bookings
CREATE POLICY "Guests can create reviews for own bookings"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = guest_id
  AND EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.id = booking_id
      AND bookings.guest_id = auth.uid()
      AND bookings.status IN ('checked_in', 'completed')
  )
);

-- Guests can view their own reviews
CREATE POLICY "Guests can view own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = guest_id);

-- Landlords can view reviews for their properties
CREATE POLICY "Landlords can view reviews for their properties"
ON public.reviews
FOR SELECT
USING (auth.uid() = landlord_id);

-- Public can view reviews (for property detail pages)
CREATE POLICY "Public can view all reviews"
ON public.reviews
FOR SELECT
USING (true);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.reviews
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
ON public.reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster lookups
CREATE INDEX idx_reviews_booking_id ON public.reviews(booking_id);
CREATE INDEX idx_reviews_property_id ON public.reviews(property_id);
CREATE INDEX idx_reviews_guest_id ON public.reviews(guest_id);
