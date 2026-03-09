

## Plan: Remove Views from Property Cards, Keep in Admin Analytics

### Overview
Hide the view count badge from public-facing property cards while preserving view tracking in the database and admin analytics dashboards.

### Changes

**1. `src/components/PropertyCard.tsx`**
- Remove the "Views" badge overlay (the `Eye` icon + `property.views.toLocaleString()` element near line 187-191)
- Remove the `Eye` import from lucide-react if no longer used

**2. No changes needed to:**
- Admin analytics (`AdminAnalyticsPage.tsx`) — already aggregates `views_count` from the database
- Admin dashboard (`AdminDashboard.tsx`) — already sums `views_count` for total views stat
- Property detail page — view tracking logic stays intact
- Database schema — `views_count` column remains unchanged

This is a UI-only removal from the public card component. All backend tracking and admin reporting remains untouched.

