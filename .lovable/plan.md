

## Plan: Add "Similar Properties" Recommendations to Property Detail Page

### Overview
Add a recommendations section below the main property content (before the Footer) that shows similar properties based on the current property's type, location, and price range.

### Changes

**1. New component: `src/components/SimilarProperties.tsx`**
- Accepts `currentProperty` props (id, property_type, city, state, price, property_category, bedrooms)
- Uses React Query to fetch up to 6 similar approved properties from Supabase, excluding the current property
- Matching logic (priority order): same `property_type`, same `state` (county), similar `property_category`, similar bedroom count
- Uses the existing `PropertyCard` component in a responsive grid (2 cols mobile, 3 cols desktop)
- Shows skeleton cards while loading, returns null if no results
- Reuses `fetchLandlordProfiles` and `transformProperty` from `useProperties.ts` for consistency

**2. Update: `src/pages/PropertyDetailPage.tsx`**
- Import and render `<SimilarProperties>` after the map/reviews section and before the Footer
- Pass the current `dbProperty` data as props
- Only render when `dbProperty` is loaded

### Query Strategy
```sql
-- Fetch similar: same property_type + same county, excluding current, limit 6
SELECT ... FROM properties
WHERE status = 'approved'
  AND id != current_id
  AND property_type = current_type
  AND state = current_state
ORDER BY views_count DESC
LIMIT 6
```
If fewer than 6 results, a secondary query broadens to same `property_type` only (any county).

### Technical Details
- Uses existing `LISTING_COLUMNS`, `transformProperty`, `fetchLandlordProfiles` from `useProperties.ts`
- Query key: `['similar-properties', propertyId]`
- Stale time: 5 minutes to avoid re-fetching on tab switches
- The component uses `PropertyCarousel` for horizontal scrolling consistency with the rest of the app

