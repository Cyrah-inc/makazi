

# Performance & Skeleton Accuracy Fixes

## Issues Identified

### Skeleton Mismatch
The loading skeletons in `PropertyCarousel` (lines 116-127) and `PropertyGrid` (lines 49-58) show only 3 generic lines but the actual `PropertyCard` renders: image, price+badge row, title, location (2-line with icon), and a features row with border-top. This causes a jarring layout shift when data loads.

### PropertyListingPage Uses Spinner Instead of Skeleton
`PropertyListingPage` lines 488-492 renders a centered `<Loader2>` spinner instead of a skeleton grid, creating a blank space during loading.

### Staggered Animations Add Perceived Delay
Every card in both `PropertyGrid` (line 80) and `PropertyCarousel` (line 134) uses `animate-fade-in-up` with incremental delays up to 400ms and 300ms. On pages with many cards, this makes the UI feel slow even after data arrives.

### Duplicate Data Fetching on Listing Pages
`BuyPage` fires 6 section hooks AND `useProperties('buy')` from `PropertyListingPage` -- that's 7 parallel Supabase queries plus 7 separate `fetchLandlordProfiles` batch calls. Same pattern on Rent and Airbnb pages.

---

## Plan

### 1. Fix skeleton card to match PropertyCard layout
Update the skeleton in both `PropertyCarousel` and `PropertyGrid` to accurately reflect the real card:
- Image: `aspect-[4/3]` (already correct)
- Price row: `h-7 w-28` (large bold price)
- Title: `h-5 w-3/4`
- Location: icon placeholder + 2-line text
- Features row: border-top + 4 small items

### 2. Replace spinner with skeleton grid in PropertyListingPage
Remove the `<Loader2>` spinner block (lines 488-492) and instead pass `isLoading` to the main `PropertyGrid` component so it shows the proper skeleton grid.

### 3. Reduce animation delays
- Cap `PropertyGrid` card animation delay to `Math.min(index * 30, 150)ms` (was 50/400)
- Cap `PropertyCarousel` to `Math.min(index * 40, 160)ms` (was 60/300)
- This cuts perceived render time by ~50%

### 4. Deduplicate listing page data fetching
The section carousel hooks already fetch category-specific data. The main `useProperties(purpose)` in `PropertyListingPage` fetches ALL properties of that purpose again (overlapping). This is fine architecturally since they serve different UI sections, but we can skip the main grid query when `categorySections` exist and no filters are active, showing only the carousel sections until the user applies a filter.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/PropertyCarousel.tsx` | Update skeleton to match PropertyCard layout; reduce animation delay |
| `src/components/PropertyGrid.tsx` | Update skeleton to match PropertyCard layout; reduce animation delay |
| `src/pages/PropertyListingPage.tsx` | Replace Loader2 spinner with PropertyGrid skeleton; defer main query when category sections exist and no filters active |

