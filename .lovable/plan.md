

## Combine Revenue & Payouts into a Unified "Finance" Section

### Current State
Two separate admin pages with overlapping data:
- **AdminRevenuePage** (`/admin/revenue`): Stats (total revenue, sub revenue, airbnb commissions, active subscribers), searchable/filterable tables for subscriptions and booking commissions
- **AdminPayoutsPage** (`/admin/payouts`): Stats (total commissions, airbnb fees, sub revenue, available balance), withdrawal dialog, tables for commission sources and withdrawal history

Both fetch similar data (bookings, subscriptions) independently. The separation creates redundancy and forces admins to navigate between pages to get a full financial picture.

### Plan

**1. Create a unified `AdminFinancePage.tsx` at `/admin/finance`**

A single page with 5 tabs covering all monetary functions:

**Tab: Overview**
- Stats row: Total Revenue, Available Balance, Total Withdrawn, Pending Payouts (landlord), Active Subscribers
- Revenue trend chart (monthly bar chart using Recharts — subscriptions vs commissions stacked)
- Withdraw button with the existing M-Pesa dialog

**Tab: Subscriptions**
- Existing subscription table from Revenue page (searchable, filterable by status)
- Stats: active, expired, cancelled counts and total subscription revenue

**Tab: Booking Commissions**
- Existing booking commissions table from Revenue page (searchable, filterable)
- Stats: total bookings, total commission earned, avg commission per booking

**Tab: Landlord Payouts**
- Table of all payouts from the `payouts` table (amount, landlord name, phone, status, receipt, date)
- Stats: total paid out to landlords, pending payouts, failed payouts

**Tab: Admin Withdrawals**
- Existing withdrawal history table from Payouts page
- Stats: total withdrawn, last withdrawal date

**2. Update sidebar and routes**
- Replace both "Revenue" and "Payouts" sidebar items with a single "Finance" item using `Wallet` icon
- Remove the `/admin/revenue` and `/admin/payouts` routes, add `/admin/finance`
- Keep old routes redirecting to `/admin/finance` for bookmarks

**3. Additional suggested features to include**
- **Revenue trend chart**: Monthly stacked bar chart (subscriptions + commissions) on Overview tab
- **Escrow summary**: Show total funds held in escrow (bookings with status `paid` — money collected but not yet released)
- **Refund tracking**: Display cancelled/refunded bookings and amounts lost
- **Payment method breakdown**: Pie chart showing M-Pesa vs Stripe split across all transactions
- **Export to CSV**: Button on each table tab to download data as CSV

### Files to modify
- **New**: `src/pages/admin/AdminFinancePage.tsx` — unified page combining both
- **Edit**: `src/components/admin/AdminSidebar.tsx` — single "Finance" nav item
- **Edit**: `src/App.tsx` — replace routes, add redirect
- **Delete content from**: `AdminRevenuePage.tsx` and `AdminPayoutsPage.tsx` — redirect to finance

### Data fetching
Single `fetchFinanceData()` function that pulls bookings, subscriptions, admin_withdrawals, payouts, and profiles in parallel. All metrics derived client-side. Reuses existing `useAdminWithdraw()` mutation for the withdrawal dialog.

