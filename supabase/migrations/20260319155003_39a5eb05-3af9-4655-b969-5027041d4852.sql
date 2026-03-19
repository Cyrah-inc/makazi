
-- Allow service role to update document_purchases (for callback)
-- Admins can update all purchases
CREATE POLICY "Admins can update purchases" ON document_purchases FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
