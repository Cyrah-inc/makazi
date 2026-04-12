

## Implemented Features

### 1. Sale Document Verification & Paid Downloads (Completed)
- Landlords upload Title Deed + Land Search for sale listings
- Buyers pay KES 1,500 via M-Pesa to access documents
- Enhanced admin property preview modal with full details

### 2. Rental Booking System with 70/30 Split (Completed)
- `RentalBookingDialog` for reserving rental properties (1-12 months)
- 30% platform fee on rental bookings (vs 10% for Airbnb)
- `booking_type` column distinguishes `airbnb` vs `rental`
- Payout edge function applies correct split per booking type

### 3. Centralized Payment Structure (Completed)
- `src/types/payments.ts` — single source of truth for all fees:
  - Airbnb commission: 10%
  - Rental commission: 30%
  - Landlord subscription: KES 2,000/month
  - Document access fee: KES 1,500

### 4. Multi-Unit Rental Price Display (Completed)
- PropertyCard shows price range (e.g., "KES 8K - 15K/mo") for multi-unit properties
- PropertyDetailPage sidebar shows per-unit-type breakdown

### 5. Performance Optimizations (Completed)
- PropertyMap lazy-loaded via `LazySection` (defers Google Maps SDK)
- RentPage carousels wrapped in `LazySection` (defers below-fold queries)
