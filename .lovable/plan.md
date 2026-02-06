

# Airbnb Booking System with Escrow Payments

## Overview

Build a complete booking flow for Airbnb properties where users can select dates, pay via M-Pesa or Stripe, and the funds are held in escrow until the guest physically checks in. Landlords receive notifications and can track bookings from their dashboard.

---

## How It Works (User Flow)

```text
+------------------+     +------------------+     +------------------+
|  1. Guest picks  | --> |  2. Guest pays   | --> |  3. Money held   |
|  check-in/out    |     |  via M-Pesa or   |     |  in escrow       |
|  dates           |     |  Stripe          |     |  (status: paid)  |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
+------------------+     +------------------+     +------------------+
|  6. Landlord     | <-- |  5. Money sent   | <-- |  4. Guest clicks |
|  sees payout in  |     |  to landlord     |     |  "Check In" at   |
|  dashboard       |     |  (M-Pesa/Stripe) |     |  the property    |
+------------------+     +------------------+     +------------------+
```

**Booking Statuses:**
- **pending_payment** -- Booking created, waiting for payment
- **paid** -- Payment received, money in escrow
- **checked_in** -- Guest confirmed arrival, payout initiated
- **completed** -- Landlord paid out, booking finished
- **cancelled** -- Booking cancelled (refund if paid)
- **refunded** -- Payment refunded to guest

---

## Phase 1: Database & Core Booking Logic

### New `bookings` table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| property_id | uuid | FK to properties |
| guest_id | uuid | The user booking |
| landlord_id | uuid | Property owner |
| check_in_date | date | Arrival date |
| check_out_date | date | Departure date |
| nights | integer | Number of nights |
| nightly_rate | numeric | Rate at time of booking |
| total_amount | numeric | nights x nightly_rate |
| service_fee | numeric | Platform fee (e.g., 10%) |
| payment_method | text | 'mpesa' or 'stripe' |
| payment_reference | text | Transaction ID from payment provider |
| payout_reference | text | Payout transaction ID to landlord |
| status | text | Booking lifecycle status |
| guest_phone | text | For M-Pesa STK push |
| landlord_phone | text | For M-Pesa B2C payout |
| checked_in_at | timestamptz | When guest confirmed check-in |
| paid_out_at | timestamptz | When landlord received funds |
| created_at | timestamptz | Booking creation time |
| updated_at | timestamptz | Last update |

### RLS Policies
- Guests can create bookings and view their own bookings
- Landlords can view bookings for their properties
- Admins can view all bookings
- Only the system (via edge functions) updates payment/payout status

---

## Phase 2: Booking UI on Property Detail Page

### Book Now Dialog
When a user clicks "Book Now" on an Airbnb property, a dialog/sheet opens with:

1. **Date Picker** -- Calendar for selecting check-in and check-out dates (supports both the date range picker and a "number of nights" shortcut)
2. **Booking Summary** -- Shows nightly rate, number of nights, subtotal, service fee, and total
3. **Payment Method Selection** -- Toggle between M-Pesa and Stripe
4. **For M-Pesa**: Phone number input field (pre-filled from profile if available)
5. **For Stripe**: Redirects to Stripe Checkout
6. **Confirm & Pay** button

### Date Availability
- Query existing bookings to block out already-booked dates on the calendar
- Show visual indicators for unavailable dates

---

## Phase 3: Payment Processing (Edge Functions)

### 3a. Stripe Payment Flow
1. **Edge Function: `create-booking-checkout`**
   - Creates a booking record with status `pending_payment`
   - Creates a Stripe Checkout Session with the total amount
   - Returns the Stripe checkout URL
   - Guest is redirected to Stripe to pay

2. **Edge Function: `stripe-booking-webhook`**
   - Listens for `checkout.session.completed` event
   - Updates booking status to `paid`
   - Stores payment reference

3. **Edge Function: `process-booking-payout`**
   - Triggered when guest checks in
   - Creates a Stripe Transfer to the landlord's connected account (or marks for manual payout)
   - Updates booking to `completed`

### 3b. M-Pesa Payment Flow
1. **Edge Function: `mpesa-stk-push`**
   - Initiates an STK Push to the guest's phone number
   - Creates booking with status `pending_payment`

2. **Edge Function: `mpesa-callback`**
   - Receives Safaricom callback confirming payment
   - Updates booking status to `paid`
   - Stores M-Pesa receipt number

3. **Edge Function: `mpesa-b2c-payout`**
   - Triggered on check-in
   - Sends B2C payment to landlord's M-Pesa number
   - Updates booking to `completed`

### Required Secrets (to be added later)
- `STRIPE_SECRET_KEY` -- For Stripe payments
- `STRIPE_WEBHOOK_SECRET` -- For webhook verification
- `MPESA_CONSUMER_KEY` -- Safaricom Daraja API
- `MPESA_CONSUMER_SECRET` -- Safaricom Daraja API
- `MPESA_SHORTCODE` -- Business shortcode
- `MPESA_PASSKEY` -- For STK Push
- `MPESA_B2C_INITIATOR` -- For B2C payouts
- `MPESA_B2C_PASSWORD` -- For B2C payouts

---

## Phase 4: Guest Booking Management

### User Dashboard Updates
- Add "My Bookings" section showing all bookings with status badges
- Each booking shows: property image, dates, total paid, current status
- **Check-In Button**: Visible only when status is `paid` and current date equals check-in date (with a small grace window)
- Booking detail view with full timeline

### New Route: `/dashboard/bookings`
- List of all guest bookings
- Filter by status (upcoming, active, past)

---

## Phase 5: Landlord Airbnb Dashboard

### New "Airbnb Bookings" page in landlord section
- Route: `/landlord/airbnb-bookings`
- New sidebar nav item with a calendar icon

### Features
- **Stats cards**: Total bookings, pending check-ins, revenue earned
- **Booking list**: Shows guest name, property, dates, amount, status
- **Notification indicators**: New booking badge count on sidebar
- **Booking detail view**: Full booking info with payment status and timeline

### Landlord M-Pesa Setup
- Add a field in the landlord profile for their M-Pesa phone number (for receiving payouts)

---

## Phase 6: Check-In & Payout Flow

### Guest Check-In
1. Guest arrives at property and opens their booking
2. A prominent "Check In" button appears (only enabled on/after check-in date)
3. Guest taps "Check In" which triggers the payout edge function
4. Booking status changes: `paid` -> `checked_in` -> `completed`
5. Toast notification confirms check-in

### Landlord Payout
- Automatic payout triggered by check-in
- For M-Pesa: B2C transfer to landlord's registered phone
- For Stripe: Transfer to landlord's connected account
- Payout status tracked in the booking record

---

## Implementation Order

Since payment provider credentials are not yet available, we will build in this order:

1. **Database migration** -- Create the `bookings` table with RLS policies
2. **Booking UI** -- Date picker dialog, booking summary, payment method selection on the property detail page
3. **Guest bookings page** -- `/dashboard/bookings` with check-in functionality
4. **Landlord Airbnb bookings page** -- `/landlord/airbnb-bookings` with stats and booking list
5. **Edge functions (scaffolded)** -- Payment processing functions ready for when credentials are added
6. **Stripe integration** -- Enable Stripe, add credentials, connect payment flow
7. **M-Pesa integration** -- Add Daraja credentials, connect STK Push and B2C flows

Steps 1-5 will be fully functional with simulated payment flow (booking created, status manually trackable). Steps 6-7 will connect real payment processing once you provide the API credentials.

---

## Files to Create/Modify

### New Files
- `src/components/booking/BookingDialog.tsx` -- Main booking flow dialog with date picker
- `src/components/booking/BookingSummary.tsx` -- Price breakdown component
- `src/components/booking/PaymentMethodSelector.tsx` -- M-Pesa / Stripe toggle
- `src/components/booking/CheckInButton.tsx` -- Check-in confirmation component
- `src/pages/user/UserBookingsPage.tsx` -- Guest's booking management page
- `src/pages/landlord/LandlordAirbnbPage.tsx` -- Landlord's Airbnb booking dashboard
- `src/hooks/useBookings.ts` -- Shared booking data hooks
- `supabase/functions/create-booking-checkout/index.ts` -- Stripe checkout creation
- `supabase/functions/stripe-booking-webhook/index.ts` -- Stripe webhook handler
- `supabase/functions/mpesa-stk-push/index.ts` -- M-Pesa payment initiation
- `supabase/functions/mpesa-callback/index.ts` -- M-Pesa payment callback
- `supabase/functions/process-booking-payout/index.ts` -- Payout on check-in

### Modified Files
- `src/pages/PropertyDetailPage.tsx` -- Add BookingDialog to the "Book Now" button
- `src/App.tsx` -- Add new routes for bookings pages
- `src/components/landlord/LandlordSidebar.tsx` -- Add Airbnb Bookings nav item
- `src/components/user/UserSidebar.tsx` -- Add My Bookings nav item
- `supabase/config.toml` -- Register new edge functions
- Database migration for `bookings` table

