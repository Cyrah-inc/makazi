

# Enhanced Airbnb Booking Details for Dashboard and Profile

## Overview

Upgrade the existing booking pages for both guests and landlords with rich detail views. Guests will see full property details, location via an interactive map with directions from their current location, booking timeline, and the ability to leave reviews. Landlords will see guest details, check-in/out timestamps, reviews, and booking management tools. Both views will be fully responsive across all screen sizes.

---

## What Gets Built

### 1. Booking Detail Page (Guest View) -- New Page

A dedicated page at `/dashboard/bookings/:id` where guests can see everything about a specific booking:

- **Property Details Card**: Property image, title, type, bedrooms, bathrooms, amenities
- **Booking Timeline**: Visual timeline showing status progression (booked, paid, checked-in, completed)
- **Dates & Payment**: Check-in/out dates, nights, nightly rate, service fee, total paid, payment method
- **Location Map with Directions**: Interactive Google Map showing the property location with a "Get Directions" button that uses the browser's geolocation API to show the route from the user's current location (opens in Google Maps for turn-by-turn navigation)
- **Review Section**: After check-in, guests can leave a star rating (1-5) and a written review for the property
- **Check-In Button**: Prominently displayed when eligible (reuses existing CheckInButton component)
- **Booking Reference**: Displays payment reference and booking ID for support

### 2. Booking Detail Page (Landlord View) -- New Page

A dedicated page at `/landlord/airbnb-bookings/:id` where landlords see:

- **Guest Information Card**: Guest name, email, phone number, avatar (fetched from profiles)
- **Property Summary**: Which property was booked, with thumbnail and link
- **Booking Timeline**: Same visual timeline as guest view
- **Check-in/Check-out Timestamps**: Exact times when guest checked in, plus expected checkout
- **Payment Breakdown**: Total amount, service fee deduction, landlord payout amount, payment status
- **Guest Review**: If the guest left a review, it appears here with star rating
- **Booking Actions**: Mark as completed, cancel booking (with appropriate status checks)

### 3. Reviews System -- New Database Table + UI

A `reviews` table to store guest reviews after staying:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| booking_id | uuid | FK to bookings (unique -- one review per booking) |
| property_id | uuid | FK to properties |
| guest_id | uuid | The reviewer |
| landlord_id | uuid | Property owner |
| rating | integer | 1-5 star rating |
| comment | text | Written review |
| created_at | timestamptz | When review was submitted |

**RLS Policies:**
- Guests can create a review for their own completed/checked-in bookings
- Guests can view their own reviews
- Landlords can view reviews for their properties
- Public can view reviews on approved properties (for future display on property detail pages)
- Admins can view all reviews

### 4. Dashboard Stats Enhancement

**User Dashboard** (`UserDashboard.tsx`):
- Add a new stats row showing: Total Bookings, Upcoming Stays, Money Spent
- Add a "Recent Bookings" quick-access section below existing Recent Inquiries, showing the 3 most recent bookings with status badges and links

**Landlord Dashboard** (`LandlordDashboard.tsx`):
- Add booking stats: Total Bookings, Revenue Earned, Active Guests, Average Rating
- Add a "Recent Bookings" section showing the latest 5 bookings with guest name, dates, and status

### 5. Enhanced Booking List Cards

**Guest Bookings Page** (`UserBookingsPage.tsx`):
- Make each booking card clickable, linking to `/dashboard/bookings/:id`
- Add a "View Details" button
- Show a mini star rating if a review exists

**Landlord Airbnb Page** (`LandlordAirbnbPage.tsx`):
- Make each table row clickable, linking to `/landlord/airbnb-bookings/:id`
- Add guest avatar/initials next to guest name
- On mobile, switch from table to card layout for better responsiveness
- Add a "View Details" link per booking

### 6. Additional Helpful Features

- **Booking Cancellation**: Guests can cancel a booking if status is `pending_payment` (before paying). Shows a confirmation dialog.
- **Duration Display**: Show "X days until check-in" or "Currently staying" or "Stayed X days ago" relative labels
- **Copy Booking Reference**: Tap-to-copy booking ID for support inquiries
- **Direct Contact**: On the booking detail, show a "Message Landlord" / "Message Guest" button linking to the messaging system

---

## Technical Details

### New Database Migration

Create the `reviews` table with RLS policies and a unique constraint on `booking_id` (one review per booking).

### New Files

| File | Purpose |
|------|---------|
| `src/pages/user/UserBookingDetailPage.tsx` | Guest booking detail page with map, timeline, review form |
| `src/pages/landlord/LandlordBookingDetailPage.tsx` | Landlord booking detail page with guest info, timeline, review display |
| `src/components/booking/BookingTimeline.tsx` | Visual status timeline component (shared between both views) |
| `src/components/booking/BookingLocationMap.tsx` | Map component with "Get Directions" using browser geolocation |
| `src/components/booking/ReviewForm.tsx` | Star rating + comment form for guests to submit reviews |
| `src/components/booking/ReviewDisplay.tsx` | Read-only review display with stars and comment |
| `src/components/booking/CancelBookingButton.tsx` | Cancel booking with confirmation dialog |
| `src/hooks/useReviews.ts` | Hooks for creating and fetching reviews |

### Modified Files

| File | Changes |
|------|---------|
| `src/App.tsx` | Add routes: `/dashboard/bookings/:id` and `/landlord/airbnb-bookings/:id` |
| `src/hooks/useBookings.ts` | Add `useBookingDetail(id)` hook that fetches a single booking with full property data (including lat/lng, amenities, bedrooms, etc.) and guest profile data |
| `src/types/booking.ts` | Extend `BookingWithProperty` to include `property_latitude`, `property_longitude`, `property_address`, `property_bedrooms`, `property_bathrooms`, `property_amenities`, `guest_phone`, `guest_avatar_url` |
| `src/pages/user/UserBookingsPage.tsx` | Make booking cards clickable with Link to detail page, add relative date labels |
| `src/pages/user/UserDashboard.tsx` | Add booking stats row and recent bookings section |
| `src/pages/landlord/LandlordAirbnbPage.tsx` | Make rows clickable, add mobile card layout, add guest avatars |
| `src/pages/landlord/LandlordDashboard.tsx` | Add booking stats and recent bookings section |

### Responsive Design Strategy

- **Mobile (< 640px)**: Single column layouts, stacked cards, full-width maps, bottom-sheet style for booking actions
- **Tablet (640-1024px)**: Two-column grids for stats, side-by-side property image + details
- **Desktop (1024px+)**: Three-column layout on detail pages (property info | booking details | map/actions sidebar)
- Landlord booking table switches to card layout on mobile using CSS/conditional rendering
- All components use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) consistently

### Map with Directions Flow

1. The `BookingLocationMap` component renders the property's location using the existing `PropertyMap` wrapper pattern (fetches Google Maps API key via edge function)
2. A "Get Directions" button calls `navigator.geolocation.getCurrentPosition()` to get the user's current coordinates
3. On success, it opens Google Maps directions in a new tab: `https://www.google.com/maps/dir/?api=1&origin={lat},{lng}&destination={propLat},{propLng}&travelmode=driving`
4. Shows a fallback if geolocation is denied, with just the property address for manual navigation

### Implementation Order

1. Create `reviews` table migration with RLS policies
2. Create shared components (BookingTimeline, ReviewForm, ReviewDisplay, BookingLocationMap, CancelBookingButton)
3. Add `useBookingDetail` and `useReviews` hooks
4. Build guest booking detail page (`UserBookingDetailPage`)
5. Build landlord booking detail page (`LandlordBookingDetailPage`)
6. Update booking list pages to link to detail pages and add mobile-responsive layouts
7. Add booking stats to both dashboards
8. Register new routes in `App.tsx`

