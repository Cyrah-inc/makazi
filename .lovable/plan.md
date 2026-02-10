

# Homepage Redesign: Category-Based Property Discovery

## Overview
Transform the homepage from a single filtered grid into an Airbnb-inspired browsing experience with multiple curated property sections, each telling a different story. The hero stays compact with search, and below it users scroll through distinct, visually engaging categories.

## New Homepage Layout (top to bottom)

1. **Hero Section** -- Keep existing but make it more compact (less vertical padding)
2. **Trending Homes** -- Most viewed properties across all types (sorted by `views_count`)
3. **Near You** -- Properties in the user's county (detected via geolocation, using existing `useGeolocation` hook). Falls back to "Popular in Nairobi" if location unavailable
4. **Exotic Getaways** -- Airbnb properties in coastal/scenic counties (Kwale/Diani, Kilifi/Watamu, Narok/Maasai Mara, Nakuru/Naivasha, Laikipia)
5. **Prime Land & Plots** -- Land listings across Kenya, highlighting investment opportunities
6. **Urban Apartments** -- Apartments for rent in major cities (Nairobi, Mombasa, Kisumu)
7. **Family Homes for Sale** -- Houses, villas, bungalows, maisonettes for sale
8. **Popular Locations** -- Keep existing LocationsSection (visual county grid)
9. **Why Choose Makazi** -- Keep existing FeaturesSection
10. **CTA Section** -- Keep existing

## Key Design Decisions

- Each category section is a **horizontal scrollable carousel** (not a full grid) -- this is the Airbnb pattern that lets users browse quickly without endless scrolling
- Each section has a title, subtitle, and a "See all" link that navigates to the relevant listing page with pre-applied filters
- Categories fetch data independently with React Query (cached, parallel, no waterfall)
- Sections with zero results are automatically hidden
- The existing `HeroSearch` is kept but the single `PropertyGrid` below it is removed in favor of the category sections

## Technical Plan

### 1. New hook: `useHomeSections` (src/hooks/useHomeSections.ts)
Create targeted React Query hooks for each homepage section. Each fetches a small set (6-8 properties) with specific filters:

- `useTrendingProperties()` -- `ORDER BY views_count DESC LIMIT 8`
- `useNearbyProperties(county)` -- `WHERE state ILIKE county LIMIT 8`
- `useExoticGetaways()` -- `WHERE property_type = 'airbnb' AND state IN (coastal/scenic counties) LIMIT 8`
- `useLandListings()` -- `WHERE property_category = 'land' LIMIT 8`
- `useUrbanApartments()` -- `WHERE property_category = 'apartment' AND property_type = 'rent' LIMIT 8`
- `useFamilyHomes()` -- `WHERE property_type = 'sale' AND property_category IN ('house','villa','bungalow','maisonette') LIMIT 8`

All reuse the existing `transformProperty` and `fetchLandlordProfiles` helpers. Lightweight column selection (same `LISTING_COLUMNS` pattern already in use).

### 2. New component: `PropertyCarousel` (src/components/PropertyCarousel.tsx)
A reusable horizontal scroll section:
- Section title + subtitle + "See all" link
- Horizontally scrollable row of `PropertyCard` components with snap scrolling
- Left/right scroll arrows on desktop (hidden on mobile where swipe works naturally)
- Shows `PropertyCardSkeleton` items while loading
- Renders nothing if the query returns zero results

### 3. Refactored `Index.tsx`
- Keep `Navbar`, hero with `HeroSearch`, `Footer`
- Remove the single `PropertyGrid` section
- Replace with a series of `PropertyCarousel` sections, each wired to its respective hook
- Use the geolocation hook to detect the user's county for the "Near You" section
- The hero search button still navigates to `/buy`, `/rent`, or `/airbnb` listing pages with filters (existing behavior)

### 4. County detection for "Near You"
- Use existing `useGeolocation` hook to get lat/lng
- Reverse-geocode to county using a simple mapping of county center coordinates (no API call needed -- use a static lookup of Kenya county bounding boxes)
- If geolocation is denied or unavailable, default to "Popular in Nairobi"

### 5. Exotic locations mapping
Define a curated list of scenic/exotic Kenyan destinations for the Airbnb section:
- Diani Beach (Kwale)
- Watamu / Malindi (Kilifi)
- Maasai Mara (Narok)
- Lake Naivasha (Nakuru)
- Nanyuki / Laikipia
- Lamu

### Files to Create
- `src/hooks/useHomeSections.ts` -- All category-specific query hooks
- `src/components/PropertyCarousel.tsx` -- Reusable horizontal scroll section

### Files to Modify
- `src/pages/Index.tsx` -- Replace single grid with multiple carousel sections
- `src/hooks/useProperties.ts` -- Export `transformProperty`, `fetchLandlordProfiles`, and `LISTING_COLUMNS` so the new hooks can reuse them

### No Database Changes Required
All categories can be queried using existing columns (`views_count`, `property_type`, `state`, `property_category`). No schema changes needed.

