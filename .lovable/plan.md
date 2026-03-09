

## Plan: Add Document Preview Modal for Admin Landlord Review

### Problem
Currently, uploaded verification documents (ID, KRA certificate) open in a new browser tab via external links. Admins should be able to view them inline in a modal/lightbox without leaving the page.

### Changes

**`src/components/admin/LandlordDetailModal.tsx`** -- Single file change

1. **Add document viewer state**: Track `previewDocUrl` and `previewDocIndex` state variables to control which document is being previewed.

2. **Modify `AdminDocumentLink`**: Instead of rendering an `<a>` tag that opens in a new tab, make the document row clickable to open a preview modal. Keep the external link as a secondary action (small icon button).

3. **Add inline document preview dialog**: Render a nested `Dialog` at the bottom of the component that displays:
   - For images (jpg/jpeg/png): Full-size image preview using `<img>` with the signed URL
   - For PDFs: An `<iframe>` with the signed URL for inline PDF viewing
   - Navigation arrows if multiple documents exist
   - A "Download / Open in new tab" button in the footer

4. **Collect signed URLs at parent level**: Move signed URL generation from individual `AdminDocumentLink` components to the parent, storing all signed URLs in a `Map<number, string>` state. This allows the preview modal to access any document's URL directly.

### Technical Details

- Reuse the existing `Dialog` component for the preview (not `ImageLightbox`, since we also need PDF support)
- Preview dialog will use `sm:max-w-3xl` for a wider view
- Image preview: `<img className="max-h-[70vh] w-full object-contain" />`
- PDF preview: `<iframe className="w-full h-[70vh]" />`
- The document label will show "National ID" for index 0 and "KRA Certificate" for index 1 (matching the upload order convention)
- Navigation between documents via left/right arrows

