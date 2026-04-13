

## Plan: Show Sale Documents Section on All Buy Listings

### Problem
The `SaleDocumentsCard` only renders when `sale_documents` has entries. Since no landlords have uploaded documents yet, the card never appears on any buy listing. Buyers don't know this feature exists.

### Solution
Show the `SaleDocumentsCard` on ALL sale/buy property listings, regardless of whether documents have been uploaded. When no documents exist, display a message like "Verification documents have not been uploaded yet" instead of hiding the section entirely.

### Changes

**`src/pages/PropertyDetailPage.tsx`**
- Remove the `sale_documents?.length > 0` condition on line 536 so the card renders for all sale properties

**`src/components/SaleDocumentsCard.tsx`**
- Remove the early `if (saleDocuments.length === 0) return null` guard
- When no documents exist, show an informational state: "The landlord has not yet uploaded verification documents for this property. Documents such as title deed and land search certificate will appear here once uploaded."
- Keep the existing paid-download flow for when documents ARE present

### Technical Details
- Line 536 condition changes from `dbProperty.property_type === 'sale' && (dbProperty as any).sale_documents?.length > 0` to just `dbProperty.property_type === 'sale'`
- Pass `saleDocuments={(dbProperty as any).sale_documents || []}` to handle null
- In `SaleDocumentsCard`, replace the `return null` with an empty-state UI showing a shield/info icon and explanatory text

