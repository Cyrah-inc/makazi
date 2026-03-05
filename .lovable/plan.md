

# Display Newly Added Listings in All Category Sections

## Problem
All "trending" and category section hooks sort exclusively by `views_count` (descending). Newly added properties start with `views_count = 0`, so they never appear in any carousel until they accumulate enough views to compete with established listings.

## Solution
Add a secondary sort by `created_at` (descending) to every section query, so that among properties with equal view counts (especially 0), the newest ones appear first. Additionally, add a dedicated "Newly Listed" / "Just Added" carousel on each page that sorts purely by `created_at DESC`, guaranteeing fresh listings always have visibility.

## Changes

### 1. Add "Newly Listed" section hook to each page's hook file

**`src/hooks/useHomeSections.ts`** -- Add `useNewlyListed()` hook:
- Query: `status=approved`, `order('created_at', { ascending: false })`, `limit(8)`

**`src/hooks/useBuySections.ts`** -- Add `useNewlyListedForSale()`:
- Same pattern, filtered to `property_type='sale'`

**`src/hooks/useRentSections.ts`** -- Add `useNewlyListedForRent()`:
- Same pattern, filtered to `property_type='rent'`

**`src/hooks/useAirbnbSections.ts`** -- Add `useNewlyListedAirbnb()`:
- Same pattern, filtered to `property_type='airbnb'`

### 2. Add secondary `created_at` sort to all existing "trending" queries

In all four hook files, append `.order('created_at', { ascending: false })` after the primary `.order('views_count', ...)` call. This ensures new listings with 0 views rank above older listings with 0 views.

Affected hooks (14 total):
- `useHomeSections.ts`: `useTrendingProperties`, `useNearbyProperties`, `useExoticGetaways`, `useUrbanApartments`, `useFamilyHomes`
- `useBuySections.ts`: `useTrendingForSale`, `useHousesForSale`, `useCommercialForSale`, `useApartmentsForSale`, `useTownhousesForSale`
- `useRentSections.ts`: `useTrendingRentals`, `useApartmentsForRent`, `useHousesForRent`
- `useAirbnbSections.ts`: `useTrendingStaycations`, `useAirbnbNearMe`, `useExoticStays`, `useBeachVibes`, `useSafariStays`, `useBudgetStays`, `useMountainRetreats`, `useCityBreaks`

### 3. Render the new "Just Added" carousels on each page

**`src/pages/Index.tsx`**: Add `PropertyCarousel` with title "Just Added" using `useNewlyListed()`, placed as the first carousel (above "Trending Homes").

**`src/pages/BuyPage.tsx`**: Add "Just Added for Sale" carousel using `useNewlyListedForSale()`.

**`src/pages/RentPage.tsx`**: Add "Just Added for Rent" carousel using `useNewlyListedForRent()`.

**`src/pages/AirbnbPage.tsx`**: Add "Just Added Stays" carousel using `useNewlyListedAirbnb()`.

Each will use a `Sparkles` or `Clock` icon from lucide-react and link to the respective listing page sorted by newest.

