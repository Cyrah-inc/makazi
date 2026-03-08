

## Enhanced Admin Analytics Dashboard

### Current State
The analytics page has basic stats (total users, landlords, properties, revenue), a revenue chart, property distribution pie charts, and tabs for response leaderboard, most viewed, most favorited, and booking status. It lacks leads tracking, subscription analytics, Buy/Rent/Airbnb segmentation, and several key admin metrics.

### Plan

**1. Create `leads` table (DB migration)**
A new table to track when users click WhatsApp or Chat buttons on property pages:
- `id`, `user_id` (nullable for anonymous), `property_id`, `landlord_id`, `lead_type` ('whatsapp' | 'chat'), `created_at`
- RLS: admins can read all, landlords can read their own, authenticated users can insert

**2. Instrument lead tracking in PropertyDetailPage**
- When a user clicks the WhatsApp button or sends a chat message, insert a row into the `leads` table
- Track property_id, landlord_id, and lead_type

**3. Rebuild AdminAnalyticsPage with comprehensive sections**

The page will be restructured with a top-level tab navigation: **Overview | Buy | Rent | Airbnb | Leads | Subscriptions**

**Overview Tab:**
- Stats row: Total Users, Total Landlords, Total Properties, Total Revenue, Total Leads, Active Subscribers
- User growth chart (registrations by month, bar chart)
- Revenue trend chart (monthly, already exists)
- Property distribution charts (by type, status, location -- already exist)

**Buy Tab:**
- Stats: Total for-sale listings, total views on sale properties, avg sale price, leads on sale properties
- Top viewed sale properties table
- Sale listings by location (bar chart)
- Price distribution chart

**Rent Tab:**
- Stats: Total rental listings, total views, avg monthly rent, leads on rent properties
- Top viewed rental properties table
- Rental listings by location
- Occupancy/inquiry metrics

**Airbnb Tab:**
- Stats: Total Airbnb listings, total bookings, total revenue, avg nightly rate, avg occupancy
- Booking status breakdown (existing)
- Revenue trend for Airbnb only
- Top performing Airbnb properties (by revenue)
- Avg rating per property

**Leads Tab:**
- Stats: Total leads, WhatsApp leads, Chat leads, leads this week/month
- Leads trend chart (by week)
- Top landlords by leads received
- Top properties generating leads
- Lead conversion funnel (lead -> inquiry -> booking)

**Subscriptions Tab:**
- Stats: Active subscribers, expired, cancelled, total subscription revenue
- Subscriber pie chart (active vs expired vs cancelled)
- Subscription trend (new subs by month)
- List of subscribers with status, plan, expiry

**Additional metrics computed from existing data:**
- Inquiry-to-booking conversion rate
- Average property rating (from reviews)
- Platform commission earned (service_fee from bookings)
- Landlord verification status breakdown
- Response leaderboard (already exists, stays in Overview)

### Files to modify
- **New migration**: Create `leads` table
- `src/pages/PropertyDetailPage.tsx` -- add lead tracking on WhatsApp/chat clicks
- `src/components/chat/WhatsAppButton.tsx` -- accept onLeadCapture callback
- `src/components/chat/InlineChatInput.tsx` -- accept onLeadCapture callback
- `src/pages/admin/AdminAnalyticsPage.tsx` -- complete rewrite with tabbed sections

### Data flow
All analytics are computed client-side from existing Supabase tables (profiles, user_roles, properties, bookings, inquiries, favorites, subscriptions, reviews, payouts, leads). The fetch function will pull all needed data in parallel and derive metrics. The `property_type` enum (`sale`, `rent`, `airbnb`) on properties drives the Buy/Rent/Airbnb segmentation. Bookings are Airbnb-only. Leads come from the new table.

