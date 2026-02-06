

# Prioritize Commute Checker Across All Views

## Overview

The Commute Checker is currently buried inside the sidebar filters on desktop and hidden behind a "Filters" sheet on mobile/tablet. This plan promotes it to a first-class, always-visible feature across all breakpoints without overcrowding the navigation or existing UI elements.

## Design Approach

### Current Problems
- On mobile/tablet, the Commute Checker is completely hidden inside the filter sheet -- users must open "Filters" to discover it
- On desktop, it sits at the top of the sidebar but competes visually with the other filters
- There is no visual indicator when commute filtering is active (e.g., on the toolbar)

### Solution Strategy
- **Mobile/Tablet**: Add a compact, collapsible commute bar just below the sticky category chips. It starts collapsed as a single-line tap target ("Filter by commute time") and expands inline to show the full commute controls. This avoids adding another full-screen sheet or overcrowding the sticky header.
- **Desktop**: Move the Commute Checker above the sidebar into a prominent, visually distinct card that is always visible. Keep it separate from the other filters to give it visual priority.
- **All Views**: Add an active commute indicator chip on the results toolbar so users always know when commute filtering is active, with a quick way to clear it.

---

## Changes Summary

### 1. Create a Compact Commute Bar Component

**New file**: `src/components/CommuteBar.tsx`

A responsive component with two display modes:
- **Collapsed** (default): A single row showing a MapPin icon, "Filter by commute time" text, and a chevron. If commute is active, it instead shows the active summary ("Within 45 min of Nairobi CBD") with a clear button.
- **Expanded**: Reveals the destination input, transport mode toggles, and max-time slider inline (using Collapsible from Radix). The expansion is smooth and stays within the page flow.

This component reuses the same `CommuteSettings` type and `onChange`/`onSearch` callbacks as the existing `CommuteChecker`, so all state management stays in `PropertyListingPage`.

### 2. Update PropertyListingPage Layout

**File**: `src/pages/PropertyListingPage.tsx`

- **Mobile/Tablet (below `lg`)**: Insert the `CommuteBar` between the sticky category chips and the header/search section. It sits outside the sticky header to avoid making the sticky area too tall.
- **Desktop (`lg` and up)**: Keep the `CommuteChecker` in the sidebar but move it into a visually distinct section with a highlighted border (e.g., `border-primary/20 bg-primary/5`) to prioritize it above the standard filters.
- **Remove** the `CommuteChecker` from the mobile filter Sheet since it will now have its own dedicated spot.
- **Add** an active commute indicator chip in the results toolbar (next to "X properties found") showing the active commute filter with a clear button.

### 3. Add Active Commute Indicator

When commute filtering is active, show a small dismissible badge/chip in the results toolbar:
- Shows: mode icon + "Within {time} of {destination}"
- Has an X button to clear the commute filter
- Visible on all breakpoints, providing persistent context

---

## Technical Details

### New Files

| File | Purpose |
|------|---------|
| `src/components/CommuteBar.tsx` | Compact collapsible commute filter for mobile/tablet |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/PropertyListingPage.tsx` | Add CommuteBar for mobile; enhance desktop CommuteChecker styling; add active commute chip in toolbar; remove CommuteChecker from mobile filter Sheet |

### Component Architecture

The `CommuteBar` wraps a Radix `Collapsible` and receives the same props as `CommuteChecker`:
- `settings: CommuteSettings` -- current destination, mode, maxMinutes
- `onChange: (settings) => void` -- updates state in parent
- `onSearch: () => void` -- triggers the API call
- `isLoading: boolean` -- shows loading state
- `isActive: boolean` -- whether commute filter is currently applied
- `onClear: () => void` -- resets commute state

### Layout Structure (Mobile)

```text
+----------------------------------+
| Navbar (sticky)                  |
+----------------------------------+
| Browse Tabs [Buy|Rent|Airbnb]    |  <- sticky
| Category Chips [All|Apt|House..] |  <- sticky
+----------------------------------+
| Commute Bar (collapsible)        |  <- NOT sticky, scrolls with content
|  [MapPin] Filter by commute...   |
|  (expands to full controls)      |
+----------------------------------+
| Header: "Properties for Sale"    |
| Search bar          [Filters]    |
| X properties found    [Grid|Lst] |
|  [Active commute chip if any]    |
+----------------------------------+
| Property Cards...                |
+----------------------------------+
```

### Layout Structure (Desktop)

```text
+------------------------------------------------------------------+
| Navbar                                                           |
+------------------------------------------------------------------+
| Header: "Properties for Sale"          [Search bar]              |
+------------------------------------------------------------------+
| Sidebar (w-72)          |  Results                               |
|                         |                                        |
| [Commute Checker]       |  X properties found    [Grid|Lst|Map] |
|  (highlighted card)     |  [Active commute chip if any]          |
|                         |                                        |
| [Filters]               |  Property Cards...                    |
|  County                 |                                        |
|  Property Type          |                                        |
|  Price Range            |                                        |
|  etc.                   |                                        |
+------------------------------------------------------------------+
```

### State Management

No new state is needed. The existing `commuteSettings`, `commuteTimes`, `isLoadingCommute`, and `commuteActive` state in `PropertyListingPage` is shared between:
- `CommuteChecker` (desktop sidebar)
- `CommuteBar` (mobile/tablet inline)
- Active commute chip (toolbar)

A new `handleClearCommute` function resets `commuteActive` to `false`, clears `commuteTimes`, and resets the destination.

