
# Admin Analytics, Settings Pages + Mobile Navigation Optimization

## 1. Analytics Page (`/admin/analytics`)

A new dedicated analytics page with rich, data-driven insights pulled from existing Supabase tables.

### Metrics and Sections

**User and Landlord Stats (Top Cards)**
- Total registered users (from `profiles`)
- Total landlords (from `user_roles` where role = landlord)
- New users this week/month (from `profiles.created_at`)
- New landlords this week/month

**Inquiry Response Leaderboard**
- Ranks landlords by average response time (computed from `inquiries.created_at` vs `inquiries.replied_at`)
- Shows fastest responders with their average reply time (e.g., "2h 15m")
- Highlights landlords with unanswered inquiries

**Most Viewed Properties (Top 10)**
- Table/list of properties sorted by `views_count` descending
- Shows property title, landlord name, view count, and listing type (sale/rent/airbnb)

**Booking Analytics**
- Total bookings by status (pending, paid, checked_in, completed, cancelled)
- Revenue trend -- bookings grouped by month using `created_at`
- Average booking value
- Displayed as a bar chart using Recharts

**Property Distribution**
- Pie chart: properties by type (sale vs rent vs airbnb)
- Pie chart: properties by status (approved, pending, rejected)
- Bar chart: properties by county/city (top 10 locations)

**Favorites Insights**
- Most favorited properties (join `favorites` with `properties`, group by `property_id`, count)

### Data Fetching
All queries use the existing Supabase client with admin RLS policies (admin can SELECT all tables). No new database tables or migrations needed -- all metrics are derived from existing data.

### Charts
Uses the already-installed `recharts` library via the existing `ChartContainer`, `ChartTooltip`, etc. components in `src/components/ui/chart.tsx`.

---

## 2. Settings Page (`/admin/settings`)

A new admin settings page with tabs for different configuration areas.

### Tabs and Sections

**Platform Settings Tab**
- Platform name display (read-only, "Makazi")
- Platform service fee percentage (currently hardcoded at 10%) -- displayed as info
- Subscription price display (KES 2,000) -- displayed as info
- These are informational cards since changing them requires code/DB changes; the settings page surfaces them for admin awareness

**User Management Quick Actions Tab**
- Quick link buttons to: Manage Users, Manage Landlords, View Revenue
- Bulk action info: how many users are active vs suspended (from `profiles.status`)

**Verification Checklist Tab**
- Displays the landlord verification document requirements
- Admin can see which documents are required (ID, KRA PIN, business phone)
- Summary: how many landlords are unverified, pending, verified, rejected

**Subscription Management Tab**
- Overview of active vs expired subscriptions
- Quick cancel action for active subscriptions (already exists in landlord detail modal, but surfaced here too)

### No Database Changes
All settings data is read from existing tables. No new migrations needed.

---

## 3. Mobile Navigation Optimization

### Problem
- The admin panel on mobile uses a hamburger menu (Sheet) with a floating button at `top-4 left-4`. This can overlap with page content.
- No bottom navigation for admin pages (BottomNav is hidden on `/admin` routes).
- The mobile Sheet lacks a `SheetTitle` for accessibility.

### Fixes

**AdminLayout.tsx**
- Add `SheetTitle` inside `SheetContent` for accessibility
- Add a sticky top header bar on mobile (instead of a floating button) with the page title and hamburger icon, providing consistent navigation context
- Remove `overflow-auto` from main on mobile to allow native scrolling

**AdminSidebar.tsx**
- Add an "Analytics" nav item pointing to `/admin/analytics`
- The existing "Settings" item already points to `/admin/settings`

**App.tsx**
- Add routes for `/admin/analytics` and `/admin/settings`
- Lazy-load both new page components

---

## Technical Summary

| Change | File | Type |
|---|---|---|
| New Analytics page with charts and data tables | `src/pages/admin/AdminAnalyticsPage.tsx` | New file |
| New Settings page with tabbed configuration view | `src/pages/admin/AdminSettingsPage.tsx` | New file |
| Add Analytics nav item to sidebar | `src/components/admin/AdminSidebar.tsx` | Edit |
| Add SheetTitle + sticky mobile header | `src/components/admin/AdminLayout.tsx` | Edit |
| Add routes for analytics and settings | `src/App.tsx` | Edit |

No database migrations required -- all data comes from existing tables with existing admin RLS policies.
