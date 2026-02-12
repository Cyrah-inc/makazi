

# Categorized Properties for Landlord, Admin Pages + Enhanced Airbnb Categories

## Overview
Transform the flat property lists on the Landlord Properties page and Admin Properties page into categorized views that group listings by type/category (e.g., "Houses for Sale", "Apartments for Rent", "Airbnb Stays"). Also add new Airbnb page categories: "Budget-Friendly Stays", "Mountain Retreats", and "City Breaks".

## What Changes

### 1. Landlord Properties Page -- Categorized Tabs
Replace the flat grid with a tabbed view that organizes the landlord's own properties into meaningful groups:

- **All Properties** -- Default view, existing grid with filters
- **For Sale** -- "Homes on the Market", "Land & Investment Plots"
- **For Rent** -- "Rental Apartments", "Rental Houses"
- **Airbnb Stays** -- "Your Short-term Listings"

Each tab shows a count badge. The existing search/filter bar stays at the top and works across all tabs. Selecting a tab simply pre-filters by `property_type` (and optionally `property_category`). This is a client-side grouping of the already-fetched data -- no new queries needed.

### 2. Admin Properties Page -- Category Summary Cards + Grouped View
Add a new row of category breakdown cards below the existing stats, then add a category filter chip bar:

**New category summary cards:**
- "Houses for Sale" (property_type=sale, category in house/villa/bungalow/maisonette)
- "Land & Plots" (property_type=sale, category=land)
- "Commercial Properties" (property_type=sale, category=commercial)
- "Rental Apartments" (property_type=rent, category=apartment)
- "Rental Houses" (property_type=rent, category in house/villa/bungalow)
- "Airbnb Stays" (property_type=airbnb)

Each card shows the count and is clickable to filter the table below. This is all client-side filtering on the already-fetched data.

### 3. Airbnb Page -- New Carousel Categories
Add 3 new sections to the Airbnb page:

- **Budget-Friendly Stays** -- Lowest priced Airbnb listings (sorted by nightly_rate ascending)
- **Mountain Retreats** -- Properties in highland counties: Nyeri, Nyandarua, Meru, Kericho, Elgeyo-Marakwet
- **City Breaks** -- Airbnb in major cities: Nairobi, Mombasa, Kisumu, Nakuru (filtered by city)

## Technical Details

### Files to Create
- None (all changes are modifications to existing files)

### Files to Modify

**`src/pages/landlord/LandlordPropertiesPage.tsx`**
- Add Tabs component (from existing ui/tabs) above the grid
- Define category groups as a constant array with label, icon, and filter function
- Each tab filters `filteredProperties` further by type/category
- Add property_category to the query select and interface

**`src/pages/admin/AdminPropertiesPage.tsx`**
- Add a "Category Breakdown" row of small clickable cards between the stats and the filter bar
- Each card counts properties matching a type+category combo from the existing `properties` state
- Clicking a card sets both `statusFilter` and `typeFilter` plus a new `categoryFilter` state
- Add `property_category` to the fetch query and interface

**`src/hooks/useAirbnbSections.ts`**
- Add `useBudgetStays()` -- sorted by `nightly_rate` ascending, limit 8
- Add `useMountainRetreats()` -- filter by highland counties, limit 8
- Add `useCityBreaks()` -- filter by major city names in `city` column, limit 8

**`src/pages/AirbnbPage.tsx`**
- Import and wire up the 3 new hooks
- Add 3 new `PropertyCarousel` components for the new categories
- Place "Budget-Friendly Stays" after "Luxury Stays", "Mountain Retreats" after "Exotic Getaways", and "City Breaks" at the end

### No Database Changes Required
All grouping uses existing `property_type`, `property_category`, `state`, `city`, and `nightly_rate` columns.

