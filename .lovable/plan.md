

# Sorting Matched Properties First + Elevating Filters

## Problem
1. When Near Me or Commute Time filters are active, properties outside the range are completely hidden. Users want to see matching properties first, with remaining properties shown below.
2. The filter sidebar only appears below the hero and category carousels, requiring users to scroll down before seeing filter options.

## Changes

### 1. Priority Sorting Instead of Hard Filtering

**File: `src/pages/PropertyListingPage.tsx`**

Currently, `filteredProperties` excludes properties outside the commute/distance range entirely (lines 207-214). Change this so location filters do NOT remove properties -- instead, the `sortedProperties` logic will sort matching properties to the top.

- **Near Me**: Properties within the radius appear first (sorted by distance), followed by remaining properties (also sorted by distance, or by default sort). A visual separator or label ("Nearby" / "Other Properties") will distinguish the two groups.
- **Commute Time**: Properties within `maxMinutes` appear first (sorted by commute time ascending), followed by the rest (sorted by commute time, with properties lacking commute data last).

The `filteredProperties` memo will still apply standard filters (county, search, price, beds, etc.) but will no longer exclude based on distance/commute. The `sortedProperties` memo will handle the prioritized ordering.

### 2. Move Filters Above Category Carousels

**File: `src/pages/PropertyListingPage.tsx`**

Restructure the page layout so the filter sidebar + results grid section appears directly after the hero, with category carousels moved below or integrated differently:

- On desktop: The sidebar with `PropertyFilters` and the results grid appear immediately after the hero (no category carousels separating them)
- Category carousels move inside the results area, above the property grid but below the toolbar
- This means users see filters right away without scrolling past carousels

### 3. Section Headers for Grouped Results

**File: `src/components/PropertyGrid.tsx`**

When a location filter is active, the grid will receive a `priorityCount` prop indicating how many properties are in the "matched" group. The grid will render a subtle section divider between the matched and unmatched groups (e.g., "Within 15 km" heading, then after those cards, "Other Properties" heading).

### 4. Active Filter Summary in Toolbar

**File: `src/pages/PropertyListingPage.tsx`**

Add active filter chips in the results toolbar showing the current location filter state (e.g., "Within 15 km" or "30 min to Westlands") with dismiss buttons, making it clear what is shaping the results order.

## Technical Summary

| Change | File |
|--------|------|
| Remove hard filtering for location; add priority sorting | `PropertyListingPage.tsx` (sortedProperties memo) |
| Move filters + grid above category carousels | `PropertyListingPage.tsx` (layout restructure) |
| Add section dividers for matched vs. other properties | `PropertyGrid.tsx` |
| Active location filter chips in toolbar | `PropertyListingPage.tsx` |

