-- Table to track individual property views with timestamps
CREATE TABLE public.property_view_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  viewer_id uuid,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

-- Index for efficient queries by property and date
CREATE INDEX idx_property_view_logs_property_id ON public.property_view_logs(property_id);
CREATE INDEX idx_property_view_logs_viewed_at ON public.property_view_logs(viewed_at);
CREATE INDEX idx_property_view_logs_daily ON public.property_view_logs(property_id, viewed_at);

-- Enable RLS
ALTER TABLE public.property_view_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert view logs (for tracking anonymous views too)
CREATE POLICY "Anyone can log property views"
  ON public.property_view_logs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Only admins can read view logs (for analytics)
CREATE POLICY "Admins can read view logs"
  ON public.property_view_logs
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Landlords can view logs for their own properties
CREATE POLICY "Landlords can view own property logs"
  ON public.property_view_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_view_logs.property_id
      AND properties.landlord_id = auth.uid()
    )
  );