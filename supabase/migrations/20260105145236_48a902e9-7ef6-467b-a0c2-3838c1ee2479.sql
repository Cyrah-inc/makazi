-- Allow admins to view all favorites
CREATE POLICY "Admins can view all favorites"
ON public.favorites
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow landlords to view favorites for their properties
CREATE POLICY "Landlords can view favorites for own properties"
ON public.favorites
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = favorites.property_id
    AND properties.landlord_id = auth.uid()
  )
);