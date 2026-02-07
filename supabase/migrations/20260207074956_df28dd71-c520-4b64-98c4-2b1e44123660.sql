-- Make landlord-documents bucket private
UPDATE storage.buckets SET public = false WHERE id = 'landlord-documents';