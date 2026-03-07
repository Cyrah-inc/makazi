

## Plan: Category "See All" Pages

### Problem
Currently, clicking "See all" on carousels like "Houses for Sale" links to `/buy?type=house`, but `PropertyListingPage` ignores the `type` query parameter. The user lands on the generic Buy page with no category filter applied.

### Solution
Read the `type` and `category` query parameters from the URL in `PropertyListingPage` and use them to initialize the `propertyType` filter. This way, existing `seeAllLink` values like `/buy?type=house` will automatically filter results to that category. Also update carousel `seeAllLink` values on the homepage and Airbnb page to use meaningful category params.

### Changes

**1. `src/pages/PropertyListingPage.tsx`**
- Read `type` from `searchParams` and initialize `filters.propertyType` with it
- When `type` param is present, set `shouldFetchMain = true` so the grid loads immediately instead of showing only carousels
- Show a clear heading like "Houses for Sale" based on the active `propertyType` filter

**2. `src/pages/Index.tsx`**
- Update `seeAllLink` values to include meaningful category params:
  - "Just Added" → `/buy` (no change)
  - "Trending Homes" → `/buy` (no change)
  - "Exotic Getaways" → `/airbnb` (no change)
  - "Prime Land & Plots" → `/buy?type=land` (already correct)
  - "Urban Apartments" → `/rent?type=apartment` (already correct)
  - "Family Homes for Sale" → `/buy?type=house` (already correct)

**3. `src/pages/BuyPage.tsx`, `src/pages/RentPage.tsx`, `src/pages/AirbnbPage.tsx`**
- Update generic `seeAllLink="/buy"` or `seeAllLink="/rent"` or `seeAllLink="/airbnb"` to include category-specific query params where applicable (e.g., luxury, furnished, budget, etc.)

### Technical detail
The key change is in `PropertyListingPage` initialization (around line 51):
```typescript
const typeParam = searchParams.get('type');
const [filters, setFilters] = useState<PropertyFilter>({
  purpose,
  county: searchParams.get('county') || undefined,
  search: searchParams.get('q') || undefined,
  propertyType: typeParam as PropertyType || undefined,
});
```

And gating logic (line 83) already checks `hasAnyFilter`, which will be `true` when `propertyType` is set from the URL, so the main grid will load automatically.

### No new files or routes needed
The existing `/buy`, `/rent`, `/airbnb` routes with query params handle everything. No new pages required.

