-- Create enum for property status
CREATE TYPE public.property_status AS ENUM ('pending', 'approved', 'rejected', 'removed');

-- Create enum for property type
CREATE TYPE public.property_type AS ENUM ('sale', 'rent', 'airbnb');

-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  property_type property_type NOT NULL DEFAULT 'rent',
  status property_status NOT NULL DEFAULT 'pending',
  price DECIMAL(12, 2) NOT NULL,
  bedrooms INTEGER NOT NULL DEFAULT 1,
  bathrooms INTEGER NOT NULL DEFAULT 1,
  area_sqft INTEGER,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'Nigeria',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  images TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Admins can view all properties
CREATE POLICY "Admins can view all properties"
ON public.properties
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update all properties
CREATE POLICY "Admins can update all properties"
ON public.properties
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete properties
CREATE POLICY "Admins can delete properties"
ON public.properties
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Landlords can view their own properties
CREATE POLICY "Landlords can view own properties"
ON public.properties
FOR SELECT
USING (auth.uid() = landlord_id);

-- Landlords can insert their own properties
CREATE POLICY "Landlords can insert own properties"
ON public.properties
FOR INSERT
WITH CHECK (auth.uid() = landlord_id);

-- Landlords can update their own properties
CREATE POLICY "Landlords can update own properties"
ON public.properties
FOR UPDATE
USING (auth.uid() = landlord_id);

-- Public can view approved properties
CREATE POLICY "Public can view approved properties"
ON public.properties
FOR SELECT
USING (status = 'approved');

-- Create index for common queries
CREATE INDEX idx_properties_landlord ON public.properties(landlord_id);
CREATE INDEX idx_properties_status ON public.properties(status);
CREATE INDEX idx_properties_type ON public.properties(property_type);
CREATE INDEX idx_properties_city ON public.properties(city);

-- Add trigger for updated_at
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();