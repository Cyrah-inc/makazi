

# Plan: Complete Airbnb M-Pesa Cash Flow (Escrow to Payout)

This plan completes the money flow so landlords can request and receive payouts from escrow, and admins can track and withdraw their commission earnings from both Airbnb bookings and subscriptions.

---

## Current State

- Guest pays via M-Pesa STK Push → booking status becomes `paid` (escrow)
- Guest checks in → status becomes `checked_in`
- Landlord can "Mark as Completed" → status becomes `completed`, but **no actual M-Pesa B2C payout happens** (it's simulated with `PAYOUT-SIM-*`)
- Admin revenue page shows stats but has **no withdrawal/payout functionality**
- The `process-booking-payout` edge function calculates payout amount but just simulates it

---

## What Will Change

### 1. Landlord: Request Payout via M-Pesa B2C

**Edge Function: `process-booking-payout`** -- Upgrade to call the Daraja B2C API to send funds to the landlord's phone number.

- When a landlord clicks "Mark as Completed" on a checked-in booking, they will be prompted to enter/confirm their M-Pesa phone number
- The edge function will:
  1. Authenticate via Daraja OAuth (reusing existing consumer key/secret)
  2. Call the B2C API (`/mpesa/b2c/v3/paymentrequest`) to send `total_amount - service_fee` to the landlord's phone
  3. Update the booking with `payout_reference` (the ConversationID) and `paid_out_at`
  4. Mark status as `completed`

**New secrets needed:**
- `MPESA_B2C_SHORTCODE` -- The B2C shortcode (may differ from the C2B/STK shortcode)
- `MPESA_B2C_INITIATOR_NAME` -- The initiator name configured in the Daraja portal
- `MPESA_B2C_SECURITY_CREDENTIAL` -- The encrypted security credential for B2C
- `MPESA_B2C_CALLBACK_URL` -- The callback URL for B2C results

**New edge function: `mpesa-b2c-callback`** -- Receives the B2C result from Safaricom and updates the booking's payout status.

**UI changes in `LandlordBookingDetailPage.tsx`:**
- Replace the simple "Mark as Completed" button with a "Request Payout" flow
- Add a phone number input dialog (pre-filled from landlord profile's `business_phone`)
- Show payout status: pending payout → payout sent → payout confirmed
- Display payout reference and timestamp when completed

**Add a new "Payouts" section to `LandlordSidebar.tsx`:**
- A new sidebar link under "Bookings & Communication" labeled "Payouts"

**New page: `LandlordPayoutsPage.tsx`:**
- Lists all completed bookings with payout details
- Shows total earnings, pending payouts, completed payouts
- Each row shows: property, guest, amount, payout status, payout reference

### 2. Admin: Commission Dashboard and Withdrawal

**New page: `AdminPayoutsPage.tsx`:**
- Shows platform commission earnings from:
  - Airbnb service fees (10% of each paid booking)
  - Subscription payments (KES 2,000 per active subscription)
- Summary cards: Total Commissions, Airbnb Fees Collected, Subscription Revenue, Available Balance
- Table of all commission-generating transactions
- "Withdraw" button to initiate B2C payout to admin's M-Pesa number

**Add to `AdminSidebar.tsx`:**
- New "Payouts" nav item between "Revenue" and "Analytics"

**Edge function: `admin-withdraw-commission`:**
- Admin-only endpoint to initiate B2C payout of accumulated commissions to admin's phone
- Records withdrawal in a new `admin_withdrawals` table

### 3. Database Changes

**New table: `payouts`** -- Track all payout attempts and results:
```
id: uuid (PK)
booking_id: uuid (FK → bookings)
landlord_id: uuid
amount: numeric
phone_number: text
status: text (pending, completed, failed)
mpesa_conversation_id: text
mpesa_receipt: text
created_at: timestamptz
completed_at: timestamptz
```

**New table: `admin_withdrawals`** -- Track admin commission withdrawals:
```
id: uuid (PK)
admin_id: uuid
amount: numeric
phone_number: text
status: text (pending, completed, failed)
mpesa_conversation_id: text
mpesa_receipt: text
source: text (airbnb_commissions, subscriptions, mixed)
created_at: timestamptz
completed_at: timestamptz
```

RLS policies:
- `payouts`: Landlords can view own payouts; admins can view all
- `admin_withdrawals`: Only admins can view and insert

### 4. Updated Booking Timeline

Add a "Paid Out" step after "Completed" in the `BookingTimeline` component so landlords can see the full lifecycle: Booked → Paid → Checked In → Completed → Paid Out.

---

## Technical Details

### M-Pesa B2C API Flow

The B2C (Business to Customer) API works differently from STK Push:

1. **Initiate**: POST to `/mpesa/b2c/v3/paymentrequest` with:
   - `OriginatorConversationID`, `InitiatorName`, `SecurityCredential`
   - `CommandID: "BusinessPayment"`
   - `Amount`, `PartyA` (shortcode), `PartyB` (phone)
   - `ResultURL` (our callback)
   - `QueueTimeOutURL`

2. **Callback**: Safaricom calls our `mpesa-b2c-callback` with the result containing `ResultCode`, `TransactionID`, etc.

3. **Security Credential**: Must be generated using the Daraja portal's certificate -- this is a one-time step the user does in their Safaricom portal.

### Secrets Required

Four new secrets are needed for B2C functionality:
- `MPESA_B2C_SHORTCODE`
- `MPESA_B2C_INITIATOR_NAME`
- `MPESA_B2C_SECURITY_CREDENTIAL`

The callback URL will be constructed from the Supabase project URL.

### File Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/process-booking-payout/index.ts` | Upgrade to call B2C API |
| `supabase/functions/mpesa-b2c-callback/index.ts` | New -- handle B2C result |
| `supabase/functions/admin-withdraw-commission/index.ts` | New -- admin withdrawal |
| `src/pages/landlord/LandlordBookingDetailPage.tsx` | Add payout request flow with phone input |
| `src/pages/landlord/LandlordPayoutsPage.tsx` | New -- payout history page |
| `src/pages/admin/AdminPayoutsPage.tsx` | New -- commission dashboard |
| `src/components/landlord/LandlordSidebar.tsx` | Add Payouts link |
| `src/components/admin/AdminSidebar.tsx` | Add Payouts link |
| `src/components/booking/BookingTimeline.tsx` | Add "Paid Out" step |
| `src/hooks/useBookings.ts` | Add `useRequestPayout` mutation, `useLandlordPayouts` query |
| `src/types/booking.ts` | Add `paid_out` status, Payout interface |
| `src/App.tsx` | Add routes for new pages |
| Database migration | Create `payouts` and `admin_withdrawals` tables with RLS |
| `supabase/config.toml` | Add `verify_jwt = false` for B2C callback |

