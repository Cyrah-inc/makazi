-- Add additional pricing columns to support multiple listing purposes
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS sale_price numeric,
ADD COLUMN IF NOT EXISTS monthly_rent numeric,
ADD COLUMN IF NOT EXISTS nightly_rate numeric;

-- Add property category column for more specific types
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS property_category text DEFAULT 'apartment';

-- Add comments for clarity
COMMENT ON COLUMN public.properties.sale_price IS 'Sale price if property is for sale';
COMMENT ON COLUMN public.properties.monthly_rent IS 'Monthly rent if property is for rent';
COMMENT ON COLUMN public.properties.nightly_rate IS 'Nightly rate if property is on Airbnb';
COMMENT ON COLUMN public.properties.property_category IS 'Property category: apartment, house, villa, mansion, land, commercial, etc.';