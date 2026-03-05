

# Fix WhatsApp, Add Video Upload, Cover Selection, Map & Owner Info

## Issues Found

### 1. WhatsApp Button Blocked
The `<a href="https://wa.me/...">` link opens inside the iframe context which blocks `api.whatsapp.com`. Fix: use `window.open()` with `onClick` instead of an anchor tag. Same fix needed for the floating mobile button.

### 2. No Cover Photo Selection
Currently the first image is always the cover. Need to let landlords click any image to set it as cover (move it to index 0).

### 3. No Video Upload Support
Need to add video upload to `PropertyImageUpload` (or a separate component), store in `property-images` bucket, and display videos in the property detail gallery. Client-side compression will use canvas-based frame reduction for lightweight optimization, with a 50MB size limit to keep things reasonable. Videos will play inline with `<video>` tag using `preload="metadata"` for fast initial load.

### 4. Map Too Small on Mobile
`PropertyMap` on detail page uses fixed `350px` height. Need to increase to `clamp(300px, 60vw, 500px)` and add a "Get Directions" button + "Open in Maps" button below the map (reuse pattern from `BookingLocationMap`).

### 5. No Property Owner Info
`property.landlordName` is hardcoded to `'Property Owner'`. Need to fetch the landlord's profile (name, avatar) and show verification badge in the sidebar card.

## Plan

### Files Changed

| File | Change |
|------|--------|
| `src/components/chat/WhatsAppButton.tsx` | Replace `<a href>` with `window.open()` onClick handler |
| `src/pages/PropertyDetailPage.tsx` | Fix floating WhatsApp to use `window.open()`; fetch landlord profile for name/avatar/verification; add directions buttons below map; increase mobile map height |
| `src/components/PropertyImageUpload.tsx` | Add cover photo selection (click to set as cover); add video upload support with size validation |
| `src/components/PropertyMap.tsx` | Accept `showDirections` prop; increase mobile height; add directions + open-in-maps buttons |

### Technical Details

**WhatsApp fix**: `window.open(`https://wa.me/...`, '_blank')` bypasses iframe blocking.

**Video upload**: Accept `video/mp4,video/webm,video/quicktime` up to 50MB. Store in same `property-images` bucket. In detail page, detect video URLs by extension and render `<video>` instead of `<img>`. Use `preload="metadata"`, `playsInline`, and lazy loading.

**Cover selection**: Add a "Set as Cover" button overlay on each image in the upload grid. Clicking moves that image to index 0.

**Landlord info**: Query `profiles` table for `full_name` and `avatar_url` by `landlord_id`. Query `landlord_public_info` for verification status. Display in the existing Agent Card with avatar, name, and a verification badge.

**Map directions**: Add Get Directions and Open in Maps buttons below the map on the property detail page (same pattern as `BookingLocationMap`). Use browser geolocation for origin.

