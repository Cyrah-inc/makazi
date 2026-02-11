

# Add Category Carousels to Buy, Rent, and Airbnb Pages

## Overview
Add curated, horizontally scrollable category carousels to each listing page (Buy, Rent, Airbnb), similar to the homepage redesign. The carousels appear above the existing filter + grid section, giving users quick access to popular subcategories. Each page gets its own tailored set of categories.

## Category Sections Per Page

### Buy Page (`/buy`)
1. **Trending for Sale** -- Most viewed sale properties
2. **Houses for Sale** -- Houses, villas, bungalows, maisonettes
3. **Land & Plots** -- Land category properties for sale
4. **Commercial & Industrial** -- Commercial properties for sale
5. **Apartments for Sale** -- Apartments listed for sale
6. **Townhouses & Maisonettes** -- Townhouses and maisonettes for sale

### Rent Page (`/rent`)
1. **Trending Rentals** -- Most viewed rental properties
2. **Apartments for Rent** -- Apartments in major cities
3. **Houses for Rent** -- Houses, villas, bungalows for rent
4. **Luxury Rentals** -- High-end rentals (top-priced)
5. **Furnished Homes** -- Properties with "Furnished" amenity
6. **Near You** -- Rentals in user's detected county (geolocation)

### Airbnb Page (`/airbnb`)
1. **Trending Staycations** -- Most viewed Airbnb listings
2. **Airbnb Near Me** -- Stays in user's detected county (geolocation)
3. **Luxury Stays** -- Top-priced Airbnb properties
4. **Exotic Getaways** -- Airbnb in scenic counties (Diani, Watamu, Mara, Lamu)
5. **Beach Vibes** -- Coastal counties (Kwale, Kilifi, Mombasa, Lamu)
6. **Safari & Wildlife** -- Narok, Laikipia, Nakuru, Samburu

## Technical Plan

### 1. New hooks file: `src/hooks/useBuySections.ts`
Exports 6 hooks, all reusing the shared `fetchAndTransform` pattern from `useHomeSections.ts`. Each targets `property_type = 'sale'` with different `property_category` or sorting filters.

### 2. New hooks file: `src/hooks/useRentSections.ts`
Exports 6 hooks targeting `property_type = 'rent'`. Includes a "Luxury Rentals" hook sorted by price descending, and a "Near You" hook using geolocation county detection.

### 3. New hooks file: `src/hooks/useAirbnbSections.ts`
Exports 6 hooks targeting `property_type = 'airbnb'`. Includes curated county lists for beach, safari, and exotic categories.

### 4. Refactor `fetchAndTransform` to shared location
Move the `fetchAndTransform` helper and `STALE_TIME` constant out of `useHomeSections.ts` into a shared utility so all section hooks can reuse it without duplication.

### 5. Update `PropertyListingPage.tsx`
- Accept an optional `categorySections` prop (a React node rendered above the filter/grid area)
- This keeps the component generic while letting each page inject its own carousels

### 6. Update `BuyPage.tsx`, `RentPage.tsx`, `AirbnbPage.tsx`
Each page becomes a small component that:
- Calls its page-specific section hooks
- Optionally calls `useGeolocation` + `detectCounty` (for Rent and Airbnb "Near You" sections)
- Renders a set of `PropertyCarousel` components
- Passes them as the `categorySections` prop to `PropertyListingPage`

## Files to Create
- `src/hooks/useBuySections.ts`
- `src/hooks/useRentSections.ts`
- `src/hooks/useAirbnbSections.ts`

## Files to Modify
- `src/hooks/useHomeSections.ts` -- Export `fetchAndTransform` and `STALE_TIME` for reuse
- `src/pages/PropertyListingPage.tsx` -- Add `categorySections` prop slot above the grid
- `src/pages/BuyPage.tsx` -- Wire up Buy-specific carousels
- `src/pages/RentPage.tsx` -- Wire up Rent-specific carousels with geolocation
- `src/pages/AirbnbPage.tsx` -- Wire up Airbnb-specific carousels with geolocation

## No Database Changes Required
All queries use existing columns (`property_type`, `property_category`, `state`, `price`, `views_count`, `amenities`).

