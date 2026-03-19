

## Plan: Sale Document Verification, Paid Document Downloads, Enhanced Admin Preview

### 1. Database Changes

**New column on `properties` table:**
- `sale_documents text[] DEFAULT '{}'::text[]` — stores paths to title deed, land search, and other verification documents uploaded by landlords

**Migration SQL:**
```sql
ALTER TABLE properties ADD COLUMN sale_documents text[] DEFAULT '{}'::text[];
```

No new tables needed. Documents will be stored in the existing `landlord-documents` bucket (private), keeping them inaccessible without signed URLs.

### 2. Landlord Add/Edit Property — Sale Documents Upload

**Files: `src/pages/landlord/AddPropertyPage.tsx`, `src/pages/landlord/EditPropertyPage.tsx`**

When "For Sale" is checked, show a new section below the sale price input:
- Title: "Verification Documents" with a description explaining these are required for sale listings
- Upload fields using `SingleDocumentUpload` for:
  - Title Deed (required)
  - Land Search Certificate (required)  
  - Additional Documents (optional, up to 3 more)
- Store uploaded file paths in `formData.saleDocuments` array
- On submit, save to the new `sale_documents` column
- Validation: require at least title deed and land search when listing for sale

### 3. Paid Document Download for Buyers (KES 1,500)

**Files: `src/pages/PropertyDetailPage.tsx`, new edge function `create-document-checkout`**

On the property detail page, for sale listings that have verification documents:
- Show a card/section: "Property Verification Documents" with a lock icon
- List document names (Title Deed, Land Search, etc.) but grayed out
- CTA button: "Access Documents — KES 1,500"
- Clicking triggers M-Pesa STK push (reuse existing `mpesa-stk-push` pattern) or Stripe checkout
- On successful payment, generate signed URLs for the documents and display download links
- Track purchases in a new `document_purchases` table

**New table `document_purchases`:**
```sql
CREATE TABLE document_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  property_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 1500,
  payment_method text NOT NULL DEFAULT 'mpesa',
  payment_reference text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE document_purchases ENABLE ROW LEVEL SECURITY;
-- Users can view own purchases
CREATE POLICY "Users can view own purchases" ON document_purchases FOR SELECT USING (auth.uid() = user_id);
-- Users can insert own purchases
CREATE POLICY "Users can insert purchases" ON document_purchases FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Admins can view all
CREATE POLICY "Admins can view all purchases" ON document_purchases FOR SELECT USING (has_role(auth.uid(), 'admin'));
```

**New edge function `create-document-checkout`:**
- Accepts `property_id`, `phone_number`, `payment_method`
- Creates a `document_purchases` record with status `pending`
- Triggers M-Pesa STK push for KES 1,500
- On callback, updates status to `completed`

**PropertyDetailPage changes:**
- Check if current user has a completed `document_purchases` record for this property
- If yes: show download buttons with signed URLs
- If no: show the payment CTA

### 4. Enhanced Admin Property Preview Modal

**File: `src/components/admin/PropertyPreviewModal.tsx`**

Expand the modal significantly:
- Change `max-w-3xl` to `max-w-5xl` for a wider view
- Add all missing property fields:
  - Property category badge
  - Sale price / Monthly rent / Nightly rate (all applicable prices)
  - Latitude/longitude coordinates
  - Rental units breakdown (if multi-unit)
  - Sale verification documents with signed URL previews/downloads
  - Landlord verification status badge
- Show ALL images in a scrollable grid (not just first 5)
- Add a two-column layout: left for images/description, right for details/stats
- Include the `sale_documents` section showing uploaded verification docs with preview links

**Updated interface** to include new fields: `sale_price`, `monthly_rent`, `nightly_rate`, `property_category`, `latitude`, `longitude`, `rental_units`, `sale_documents`, landlord verification status.

**AdminPropertiesPage.tsx** — update `fetchProperties` to also select `sale_documents`, `sale_price`, `monthly_rent`, `nightly_rate`, `latitude`, `longitude`, `rental_units` and pass them to the modal.

### Summary of Files Changed

1. **Migration** — add `sale_documents` column + `document_purchases` table
2. `src/pages/landlord/AddPropertyPage.tsx` — sale documents upload section
3. `src/pages/landlord/EditPropertyPage.tsx` — same upload section for editing
4. `src/pages/PropertyDetailPage.tsx` — paid document access section
5. `src/components/admin/PropertyPreviewModal.tsx` — enlarged modal with all property details
6. `src/pages/admin/AdminPropertiesPage.tsx` — fetch and pass additional fields
7. `src/integrations/supabase/types.ts` — auto-updated after migration
8. New edge function: `supabase/functions/create-document-checkout/index.ts`

