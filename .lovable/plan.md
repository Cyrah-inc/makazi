

# Fix: Search Results Section + Mobile Landlord Listing

## Issue 1: Search Results Not Displayed as a Separate Category

**Current behavior**: When a user searches by name, activates "Near Me", or uses "Commute Time" on Buy/Rent/Airbnb pages, the results are sorted in the main property grid but not visually distinguished as a separate section above the category carousels.

**Root cause**: In `PropertyListingPage.tsx`, the category carousels (`categorySections`) always render above the property grid (lines 437-441). When search/location filters are active, matched results are only priority-sorted within the grid -- there is no separate "Search Results" section shown above the carousels.

**Fix**: When any search filter is active (text search, Near Me, or Commute Time), render a "Search Results" section with matching properties above the category carousels. The category carousels continue to show below. The main grid below the carousels shows remaining properties.

### Changes to `src/pages/PropertyListingPage.tsx`:
- Extract "search result" properties (those matching the active filter) into a separate array
- Render a `PropertyGrid` with title "Search Results" above `categorySections` when search/nearme/commute is active
- The lower grid shows "Other Properties" or all properties when no search is active

### Changes to `src/pages/Index.tsx`:
- The Home page uses `HeroSearch` which navigates to Buy/Rent/Airbnb pages with query params. No separate search results section is needed on the Home page itself since the search action redirects users to the relevant listing page.

---

## Issue 2: Landlords Cannot List Properties on Mobile

**Current behavior**: On mobile, landlords have difficulty listing properties.

**Root causes identified**:

1. **Navigation**: The "Add Property" button is only accessible through the hamburger menu sidebar. There is no visible shortcut or floating action button (FAB) on the landlord dashboard or properties page on mobile, making it hard to discover.

2. **Form scrolling**: The `LandlordLayout` main area uses `overflow-auto` inside a `flex` parent. On some mobile browsers, the long AddPropertyPage form (images, details, pricing, location with map, amenities, submit) may have scroll containment issues. The submit button at the very bottom of the form can be unreachable on certain devices.

3. **Missing SheetTitle**: The mobile sidebar `Sheet` in `LandlordLayout.tsx` wraps `SheetContent` without a `SheetTitle`, which causes Radix accessibility warnings and can cause focus management issues on mobile.

**Fixes**:

### Changes to `src/components/landlord/LandlordLayout.tsx`:
- Add `SheetTitle` inside `SheetContent` for accessibility and proper focus management
- Remove `overflow-auto` from `main` element on mobile to allow native page scrolling (prevents scroll containment issues)

### Changes to `src/pages/landlord/LandlordDashboard.tsx`:
- Add a sticky/floating "Add Property" button visible on mobile at the bottom of the dashboard, so landlords can easily find the action without navigating through the hamburger menu

### Changes to `src/pages/landlord/LandlordPropertiesPage.tsx`:
- Similarly ensure the "Add New Property" button is prominently placed on mobile

### Changes to `src/pages/landlord/AddPropertyPage.tsx`:
- Add `pb-8` (bottom padding) to the form container to ensure the submit button has clearance on mobile
- Make the submit/cancel buttons sticky at the bottom on mobile so they're always accessible regardless of scroll position

---

## Technical Summary

| Change | File |
|---|---|
| Show "Search Results" section above carousels when filters are active | `PropertyListingPage.tsx` |
| Add SheetTitle to mobile sidebar for proper focus management | `LandlordLayout.tsx` |
| Fix scroll containment on mobile | `LandlordLayout.tsx` |
| Add floating/sticky "Add Property" button on mobile | `LandlordDashboard.tsx`, `LandlordPropertiesPage.tsx` |
| Make submit buttons sticky on mobile for long form | `AddPropertyPage.tsx` |

