

# Redesign: Buy, Rent & Airbnb Listing Pages

## Overview

A fresh layout that replaces the current top-down hero + floating sidebar pattern with a modern split-panel design. The hero becomes a slim, search-focused bar with integrated location/proximity controls (replacing the stats). All filters (including the commute checker) move to a persistent left sidebar. The result is a cleaner, more usable layout inspired by property portals like Zillow and Rightmove.

## What Changes

### 1. Hero Section Redesign -- "Search & Location Bar"

Remove the stats (Listed, Avg. Price, Counties) from the hero. Replace with:

- **Compact Header**: Icon + title + subtitle (keep existing)
- **Search Input**: Stays as-is
- **Location Quick Actions**: Two prominent action buttons replacing the stats area:
  - "Near Me" pill button -- one tap activates GPS-based proximity filtering with a radius selector dropdown
  - "Commute Time" pill button -- opens an inline commute destination input with transport mode selector
- **Active Location Indicator**: When a location filter is active, show a dismissible chip below the search bar summarizing the filter (e.g., "Within 15 km of you" or "30 min transit to Westlands")

This merges the current `CommuteBar` (mobile) and `CommuteChecker` (desktop sidebar) directly into the hero, making it the single entry point for location-based filtering on all screen sizes.

### 2. Sidebar Filter Panel -- Always Visible on Desktop

Move ALL filters into a sticky left sidebar on desktop (already partially done, but now the CommuteChecker lives in the hero instead):

- **Sidebar contents** (top to bottom):
  - Property Type chips (replaces the separate QuickPickBar)
  - County / Town dropdowns
  - Price Range slider
  - Bedrooms selector
  - Bathrooms selector
  - Furnished toggle
  - Sort By dropdown
- **Sticky behavior**: `position: sticky; top: 80px` so it scrolls with content but stays visible
- **Mobile**: Opens as a slide-out Sheet (existing pattern) triggered by a "Filters" button in the toolbar
- The QuickPickBar and separate sort chips row are removed from the main content area to reduce visual clutter

### 3. Main Content Area -- Wider Grid

With the location controls in the hero and category filters in the sidebar:
- Category carousels remain between hero and grid
- The grid area gets more width (no sidebar commute checker eating space)
- Results toolbar simplified: just count + active filter chips + view mode toggle
- Sort is handled in the sidebar, so sort chips row is removed from the toolbar

### 4. Mobile Layout

- Hero: same compact search + location buttons
- Below hero: category carousels
- Sticky toolbar: property count + "Filters" sheet button + view mode
- No separate CommuteBar component -- it's integrated into the hero
- Full-width property grid

## Technical Details

### Files to Modify

**`src/components/ListingHero.tsx`** -- Major redesign:
- Remove `stats` prop entirely
- Add location filter props (Near Me button, Commute input, active state display)
- New layout: two-row design with search on first row, location quick actions on second row
- Active location chip shown below when filtering is active

**`src/pages/PropertyListingPage.tsx`** -- Restructure layout:
- Remove `heroStats` prop
- Pass location filter state to `ListingHero` instead of rendering separate `CommuteBar`/`CommuteChecker`
- Remove the `CommuteBar` mobile section
- Remove the `CommuteChecker` from the desktop sidebar
- Remove the `QuickPickBar` sticky section (move property type filtering into `PropertyFilters`)
- Remove the sort chips row (sort is in sidebar)
- Simplify the results toolbar

**`src/components/PropertyFilters.tsx`** -- Add property type chips:
- Add a horizontal chip selector for property types at the top of the filter panel (replacing the separate QuickPickBar)
- Keep all existing filter controls

**`src/pages/BuyPage.tsx`** -- Remove `heroStats` prop
**`src/pages/RentPage.tsx`** -- Remove `heroStats` prop  
**`src/pages/AirbnbPage.tsx`** -- Remove `heroStats` prop

### Files to Remove (no longer needed as standalone)
- `src/components/CommuteBar.tsx` -- functionality merged into ListingHero
- `src/components/QuickPickBar.tsx` -- functionality merged into PropertyFilters

### New Component
- `src/components/LocationFilterBar.tsx` -- Extracted reusable component for the hero's location quick actions (Near Me / Commute toggle with inline controls). Used inside ListingHero. This keeps the hero component manageable.

### Layout Structure (Desktop)

```text
+--------------------------------------------------+
|  Navbar                                          |
+--------------------------------------------------+
|  Hero: [Icon Title]                              |
|  [Search input........................]          |
|  [Near Me] [Commute Time]  (location actions)   |
|  [Active: Within 15 km of you        X]         |
+--------------------------------------------------+
|  Category Carousels (horizontal scroll)          |
+--------------------------------------------------+
|  Sidebar (sticky)  |  Results Grid               |
|  - Property Type   |  [8 Listed] [Grid/List]     |
|  - County/Town     |  +------+ +------+ +------+ |
|  - Price Range     |  | Card | | Card | | Card | |
|  - Bedrooms        |  +------+ +------+ +------+ |
|  - Bathrooms       |  +------+ +------+ +------+ |
|  - Furnished       |  | Card | | Card | | Card | |
|  - Sort By         |  +------+ +------+ +------+ |
+--------------------------------------------------+
```

### Layout Structure (Mobile)

```text
+---------------------------+
|  Browse Tabs [Buy|Rent|Airbnb]
+---------------------------+
|  Hero: Title + Search     |
|  [Near Me] [Commute]      |
+---------------------------+
|  Category Carousels       |
+---------------------------+
|  [8 props] [Filters] [Grid]
+---------------------------+
|  Property Cards (grid)    |
+---------------------------+
```

### Key Design Decisions
- Location filtering is elevated to hero-level prominence (most users filter by location first)
- Stats removed -- they add visual noise without driving user actions
- Single sidebar for all filters reduces cognitive load
- QuickPickBar chips move into the sidebar filter panel for a cleaner content area
- CommuteBar/CommuteChecker consolidated into one `LocationFilterBar` component used in the hero

