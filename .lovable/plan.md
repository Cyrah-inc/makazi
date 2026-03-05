

# AI Description Generator Enhancements

## Changes

### 1. Add custom prompt input field
Add a text input above the tone selector where landlords can describe what they want, e.g. "3 bedroom house in Kitengela with swimming pool, close to schools". This `customPrompt` field is sent to the edge function and incorporated into the AI prompt so each generation is unique to the landlord's vision.

### 2. Update edge function prompt to produce single paragraph
Modify `supabase/functions/generate-description/index.ts`:
- Accept new `customPrompt` field from the request body
- Change the system prompt to explicitly require **one single paragraph** (no line breaks)
- Instruct the AI to be captivating, detailed, and fascinating -- paint a vivid picture
- If `customPrompt` is provided, include it as the landlord's specific vision/instructions
- Reduce temperature slightly (0.7) for more focused output

### 3. Add preview dialog
After generating a description, show a "Preview" button that opens a `Dialog` displaying the description exactly as it would appear on the public property detail page -- using the same typography, spacing, and card styling from `PropertyDetailPage`. This lets landlords see the final look before saving.

### 4. Apply to both AddPropertyPage and EditPropertyPage
Both pages get:
- `customPrompt` state + input field (placeholder: "Describe what you want, e.g. 3 bedroom house in Kitengela...")
- Preview button (visible when description exists) that opens the preview dialog
- Same edge function call with `customPrompt` included

### Files to modify
- `supabase/functions/generate-description/index.ts` -- prompt changes + accept `customPrompt`
- `src/pages/landlord/AddPropertyPage.tsx` -- custom prompt input, preview dialog
- `src/pages/landlord/EditPropertyPage.tsx` -- same changes

