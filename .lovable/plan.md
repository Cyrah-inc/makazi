

# Admin Revenue, Listings Management, Airbnb Admin & Real Dashboard Stats

## Overview

This plan covers four major changes to the admin panel:

1. **Revenue Page** -- A new admin page to track subscription revenue and Airbnb booking commissions (10% service fees), with summary stats and a transaction table.
2. **Listings Page Redesign** -- Replace the current "Add Listing" form with a proper listings overview showing total property counts grouped by landlord, with filters and search.
3. **Airbnb Management Page** -- A new admin page showing all Airbnb bookings across all landlords with stats, filters, and detail views.
4. **Real Dashboard Stats** -- Replace the hardcoded mock numbers on the admin dashboard with live data from Supabase (users, landlords, properties, bookings, views, revenue).

---

## 1. Admin Revenue Page

**New file**: `src/pages/admin/AdminRevenuePage.tsx`

### Content

- **Stats cards** at the top:
  - Total Revenue (subscriptions + Airbnb service fees combined)
  - Subscription Revenue (sum of all subscription payments with status = active)
  - Airbnb Commissions (sum of `service_fee` from bookings with status in [paid, checked_in, completed])
  - Active Subscribers (count of subscriptions with active status and valid expiry)

- **Revenue breakdown tabs** (using Tabs component):
  - **Subscriptions Tab**: Table of all subscription records showing landlord name, email, plan, amount (KES 2,000), payment method, status, start/expiry dates
  - **Airbnb Commissions Tab**: Table of all bookings showing guest name, property title, landlord name, total amount, service fee (platform commission), booking status, dates

- **Filters**: Search by landlord name, filter by status (active/expired for subscriptions; paid/checked_in/completed for bookings)

### Data Sources
- `subscriptions` table joined with `profiles` for landlord name/email
- `bookings` table joined with `profiles` (guest + landlord) and `properties` for property title
- All fetched via admin RLS policies (already in place)

---

## 2. Listings Page Redesign

**Modified file**: `src/pages/admin/AdminListingsPage.tsx`

Replace the current "Add New Listing" form with a **Listings Overview** page that shows:

### Content

- **Stats cards**: Total Listings, For Sale count, For Rent count, Airbnb count
- **Landlord Listings Table**: Grouped or flat view showing:
  - Landlord name and email
  - Number of properties (total, approved, pending)
  - Listing types breakdown (sale/rent/airbnb counts)
  - Verification status badge
  - Subscription status badge
  - "View Properties" button that links to `/admin/properties?landlord={id}` (filtered)
- **Search and filters**: Search by landlord name, filter by verification status, filter by subscription status

### Data Sources
- `properties` table grouped by `landlord_id`
- `profiles` for landlord name/email
- `landlord_profiles` for verification status
- `subscriptions` for subscription status

---

## 3. Admin Airbnb Management Page

**New file**: `src/pages/admin/AdminAirbnbPage.tsx`

### Content

- **Stats cards**:
  - Total Airbnb Listings (properties with type = airbnb)
  - Total Bookings (all bookings count)
  - Platform Revenue (sum of service fees from paid/checked_in/completed bookings)
  - Active Check-ins (bookings with status = checked_in)

- **Bookings Table**: All bookings across all landlords with:
  - Guest name and email
  - Property title and city
  - Landlord name
  - Check-in / Check-out dates
  - Total amount and platform fee
  - Payment method (M-Pesa/Stripe)
  - Status with color-coded badges
  - Booking date
- **Filters**: Search by guest/landlord/property name, filter by status, filter by payment method

### Data Sources
- `bookings` table (admin can see all via RLS)
- `profiles` for guest and landlord details
- `properties` for property title/city

---

## 4. Real Dashboard Stats

**Modified file**: `src/pages/admin/AdminDashboard.tsx`

Replace all hardcoded values with real database queries:

- **Total Users**: Count from `profiles` table
- **Active Landlords**: Count from `user_roles` where role = landlord
- **Total Properties**: Count from `properties` table
- **Total Views**: Sum of `views_count` from `properties` table
- **Properties for Sale**: Count where property_type = sale and status = approved
- **Properties for Rent**: Count where property_type = rent and status = approved
- **Airbnb Listings**: Count where property_type = airbnb and status = approved

All fetched in a single `useQuery` hook with parallel Supabase calls.

**Modified file**: `src/components/admin/RecentActivity.tsx`

Replace mock activities with real data:
- Recent property submissions (from `properties` ordered by created_at desc, limit 5)
- Recent user signups (from `profiles` ordered by created_at desc, limit 5)
- Combine and sort by timestamp, show relative time using `formatDistanceToNow`

---

## 5. Sidebar Updates

**Modified file**: `src/components/admin/AdminSidebar.tsx`

Update the sidebar navigation items:
- Keep: Dashboard, Users, Landlords, Properties
- Rename "Listings" to "Listings Overview" (same path `/admin/listings`)
- Add: "Airbnb" with a CalendarDays icon -> `/admin/airbnb`
- Add: "Revenue" with a DollarSign icon -> `/admin/revenue`
- Remove or keep Analytics and Settings as placeholders

---

## 6. Route Updates

**Modified file**: `src/App.tsx`

Add new routes:
- `/admin/revenue` -> `AdminRevenuePage`
- `/admin/airbnb` -> `AdminAirbnbPage`

---

## Technical Details

### New Files

| File | Purpose |
|------|---------|
| `src/pages/admin/AdminRevenuePage.tsx` | Revenue tracking for subscriptions and Airbnb commissions |
| `src/pages/admin/AdminAirbnbPage.tsx` | Admin-level Airbnb booking management |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/admin/AdminDashboard.tsx` | Replace hardcoded stats with live Supabase queries |
| `src/components/admin/RecentActivity.tsx` | Replace mock data with real recent activities |
| `src/pages/admin/AdminListingsPage.tsx` | Replace form with listings overview grouped by landlord |
| `src/components/admin/AdminSidebar.tsx` | Add Revenue and Airbnb nav items |
| `src/App.tsx` | Add `/admin/revenue` and `/admin/airbnb` routes |

### Data Architecture

All admin queries rely on existing RLS policies that grant admins SELECT access to all tables. No database changes are needed.

```text
Admin Dashboard
  +-- profiles (count = total users)
  +-- user_roles (count landlords)
  +-- properties (count, sum views, group by type)
  +-- bookings (for recent activity)

Revenue Page
  +-- subscriptions (all records, joined with profiles)
  +-- bookings (service_fee sums, joined with profiles + properties)

Listings Overview
  +-- properties (grouped by landlord_id)
  +-- profiles (landlord name/email)
  +-- landlord_profiles (verification status)
  +-- subscriptions (subscription status)

Airbnb Management
  +-- bookings (all records)
  +-- profiles (guest + landlord details)
  +-- properties (title, city, type)
```

### Component Patterns

All new pages follow the existing admin page pattern:
- Wrapped in `AdminLayout`
- Stats cards at top using the existing `Card` component pattern (matching `AdminPropertiesPage` style)
- Table with search + filters below
- Loading state with `Loader2` spinner
- Empty state with descriptive message
- Responsive: tables scroll horizontally on mobile, stats grid adapts from 2-col to 4-col

