
-- Add sale_documents column to properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS sale_documents text[] DEFAULT '{}'::text[];

-- Create document_purchases table
CREATE TABLE IF NOT EXISTS document_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 1500,
  payment_method text NOT NULL DEFAULT 'mpesa',
  payment_reference text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE document_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON document_purchases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert purchases" ON document_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all purchases" ON document_purchases FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
