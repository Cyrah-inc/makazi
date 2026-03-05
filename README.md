# Makazi — Kenya's Premier Property Platform

**Live URL:** [makazi.lovable.app](https://makazi.lovable.app)

Makazi is a full-featured real estate platform built for the Kenyan market, supporting property sales, rentals, and short-stay (Airbnb-style) bookings — all in one place.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Authentication & Roles](#authentication--roles)
- [Database Schema](#database-schema)
- [Payments](#payments)
- [Edge Functions](#edge-functions)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Features

### For Users (Tenants / Buyers / Guests)
- **Browse properties** — Filter by purpose (Buy, Rent, Airbnb), location, price, bedrooms, amenities, and property type
- **"Near Me" search** — Uses browser geolocation to sort properties by distance
- **Commute time filter** — Google Maps Distance Matrix integration to filter by commute time to a destination
- **Favorites** — Save properties to a personal favorites list
- **Bookings** — Book Airbnb-style stays with date selection, payment (M-Pesa STK Push or Stripe), and check-in tracking
- **Reviews** — Leave star ratings and comments after completed stays
- **Real-time chat** — In-app messaging between users and landlords, with typing indicators and unread counts
- **Formal messages** — Subject-based message threads (inquiry-style)
- **Inquiries** — Submit property inquiries directly to landlords
- **WhatsApp integration** — Quick-contact button that opens WhatsApp with a pre-filled message
- **Mortgage calculator** — Estimate monthly payments on sale properties

### For Landlords
- **Property management** — Add, edit, and manage listings with multi-image uploads
- **Multi-purpose listings** — A single property can be listed for sale, rent, and/or Airbnb simultaneously
- **Multi-unit support** — Define rental unit types (e.g., 1BR × 10 units at KES 15,000)
- **Booking management** — View incoming bookings, confirm check-ins, and process payouts
- **Verification system** — Upload ID, KRA PIN, and business documents for admin verification
- **Subscription gating** — Landlords must have an active subscription to list properties
- **Dashboard** — Overview of properties, bookings, inquiries, reviews, and payouts
- **Chat & messages** — Communicate with prospective tenants/buyers

### For Admins
- **Admin dashboard** — Platform-wide statistics (users, properties, views, revenue)
- **Property approvals** — Review and approve/reject pending property listings
- **Landlord verification** — Approve landlord profiles after document review
- **User management** — View and manage all platform users
- **Revenue & payouts** — Track platform commissions and process admin withdrawals via M-Pesa B2C
- **Reviews moderation** — View all reviews across the platform
- **Analytics** — Platform usage and performance metrics

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite |
| **Styling** | Tailwind CSS, shadcn/ui (Radix primitives) |
| **State Management** | TanStack React Query v5 |
| **Routing** | React Router v6 |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, Edge Functions, RLS) |
| **Payments** | M-Pesa Daraja API (STK Push + B2C), Stripe (checkout sessions + webhooks) |
| **Maps** | Google Maps JavaScript API (@react-google-maps/api) |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod validation |

---

## Project Structure

```
src/
├── components/
│   ├── admin/          # Admin dashboard components (sidebar, stats, approvals)
│   ├── booking/        # Booking dialog, payment, reviews, check-in
│   ├── chat/           # Real-time chat (list, thread, WhatsApp button)
│   ├── landlord/       # Landlord layout, verification, document upload
│   ├── messages/       # Formal message system (compose, list, detail)
│   ├── skeletons/      # Loading skeleton components
│   ├── ui/             # shadcn/ui primitives (button, dialog, card, etc.)
│   └── user/           # User dashboard layout and sidebar
│   ├── BottomNav.tsx           # Mobile bottom navigation
│   ├── CategorySection.tsx     # Property category carousels
│   ├── Footer.tsx              # Site footer
│   ├── HeroSearch.tsx          # Homepage hero with search
│   ├── InquiryForm.tsx         # Property inquiry form
│   ├── LocationPicker.tsx      # Google Maps location picker
│   ├── MortgageCalculator.tsx  # Buy page mortgage tool
│   ├── Navbar.tsx              # Top navigation bar
│   ├── PropertyCard.tsx        # Property listing card
│   ├── PropertyFilters.tsx     # Sidebar filters (price, beds, amenities)
│   ├── PropertyGrid.tsx        # Grid/list view for properties
│   └── PropertyMap.tsx         # Map view with markers
├── contexts/
│   └── FavoritesContext.tsx    # Favorites state provider
├── hooks/
│   ├── useAuth.tsx             # Authentication hook (login, signup, roles)
│   ├── useBookings.ts          # Booking CRUD + M-Pesa/Stripe hooks
│   ├── useChat.ts              # Real-time chat with Supabase subscriptions
│   ├── useConversations.ts     # Conversation list management
│   ├── useFavorites.ts         # Favorites toggle logic
│   ├── useGeolocation.ts       # Browser geolocation
│   ├── useLandlordProfile.ts   # Landlord verification status
│   ├── useMessages.ts          # Formal messages CRUD
│   ├── useProperties.ts        # Property fetching with filters
│   └── useReviews.ts           # Review submission and display
├── integrations/
│   └── supabase/
│       ├── client.ts           # Supabase client initialization
│       └── types.ts            # Auto-generated database types
├── lib/
│   ├── bookingUtils.ts         # Booking date helpers
│   ├── formatters.ts           # Currency & number formatting (KES)
│   ├── geoUtils.ts             # Haversine distance calculation
│   ├── imageUtils.ts           # Supabase Storage image helpers
│   ├── locations.ts            # Kenya county/town data
│   └── utils.ts                # Tailwind merge utility
├── pages/
│   ├── admin/                  # Admin pages (dashboard, listings, users, etc.)
│   ├── auth/                   # Login/signup page
│   ├── landlord/               # Landlord pages (dashboard, properties, bookings)
│   ├── user/                   # User pages (dashboard, bookings, favorites)
│   ├── Index.tsx               # Homepage
│   ├── BuyPage.tsx             # Properties for sale
│   ├── RentPage.tsx            # Properties for rent
│   ├── AirbnbPage.tsx          # Short-stay properties
│   ├── PropertyDetailPage.tsx  # Single property view
│   └── PropertyListingPage.tsx # Filtered property listings
├── types/
│   ├── booking.ts              # Booking, Payout, AdminWithdrawal types
│   ├── conversation.ts         # Chat conversation types
│   ├── message.ts              # Message types
│   └── property.ts             # Property, Filter, constants
└── index.css                   # Global styles & CSS custom properties

supabase/
├── config.toml                 # Supabase local dev configuration
├── functions/
│   ├── admin-withdraw-commission/  # Admin M-Pesa B2C withdrawal
│   ├── calculate-commute/          # Google Maps commute time API
│   ├── create-booking-checkout/    # Stripe checkout session
│   ├── get-maps-key/               # Secure Google Maps key retrieval
│   ├── mpesa-b2c-callback/         # M-Pesa B2C payout callback
│   ├── mpesa-callback/             # M-Pesa STK Push payment callback
│   ├── mpesa-stk-push/             # Initiate M-Pesa STK Push
│   ├── process-booking-payout/     # Process landlord payout after check-in
│   ├── process-subscription/       # Landlord subscription processing
│   └── stripe-booking-webhook/     # Stripe payment webhook
└── migrations/                 # Database migration files
```

---

## Authentication & Roles

Authentication is handled by **Supabase Auth** with email/password sign-up.

### Roles

Roles are stored in a dedicated `user_roles` table (not on the profile) to prevent privilege escalation:

| Role | Access |
|---|---|
| `user` | Browse, favorite, book, review, chat |
| `landlord` | All user features + list properties, manage bookings, receive payouts |
| `admin` | Full platform access, approve properties/landlords, withdraw commissions |

Role checks use a `has_role(_user_id, _role)` **security definer function** to avoid RLS recursion.

---

## Database Schema

### Core Tables

| Table | Purpose |
|---|---|
| `profiles` | User profiles (name, email, phone, avatar) |
| `user_roles` | Role assignments (admin, landlord, user) |
| `properties` | Property listings with all details |
| `favorites` | User-saved properties |
| `inquiries` | Property inquiry messages |
| `bookings` | Airbnb-style booking records |
| `reviews` | Post-stay guest reviews |
| `payouts` | Landlord payout records (M-Pesa B2C) |
| `conversations` | Chat conversation metadata |
| `messages` | Chat and formal messages |
| `landlord_profiles` | Landlord verification data and documents |
| `subscriptions` | Landlord subscription records |
| `admin_withdrawals` | Admin commission withdrawal records |

### Key Views

| View | Purpose |
|---|---|
| `landlord_public_info` | Public-facing landlord verification status |

### Enums

- `app_role`: `admin`, `landlord`, `user`
- `property_status`: `pending`, `approved`, `rejected`, `removed`
- `property_type`: `sale`, `rent`, `airbnb`

---

## Payments

### M-Pesa (Primary — Kenya)

- **STK Push** (`mpesa-stk-push`): Initiates a payment prompt on the guest's phone
- **Callback** (`mpesa-callback`): Receives Safaricom's async payment confirmation, updates booking status
- **B2C Payout** (`process-booking-payout`): Sends landlord earnings (total − 10% service fee) via M-Pesa
- **B2C Callback** (`mpesa-b2c-callback`): Confirms payout completion
- **Admin Withdrawal** (`admin-withdraw-commission`): Admins withdraw accumulated commission

### Stripe (International)

- **Checkout** (`create-booking-checkout`): Creates a Stripe Checkout session
- **Webhook** (`stripe-booking-webhook`): Handles `checkout.session.completed` events

### Escrow Flow

1. Guest pays → status becomes `paid` (funds in escrow)
2. Landlord confirms check-in → status becomes `checked_in`
3. After stay, payout is processed → status becomes `completed`
4. 10% service fee is retained as platform commission

---

## Edge Functions

| Function | Auth | Description |
|---|---|---|
| `mpesa-stk-push` | User JWT | Initiate M-Pesa payment |
| `mpesa-callback` | None (Safaricom) | Receive payment confirmation |
| `mpesa-b2c-callback` | None (Safaricom) | Receive payout confirmation |
| `create-booking-checkout` | User JWT | Create Stripe checkout |
| `stripe-booking-webhook` | Stripe signature | Handle Stripe events |
| `process-booking-payout` | Landlord/Admin JWT | Process landlord payout |
| `process-subscription` | Landlord JWT | Activate landlord subscription |
| `admin-withdraw-commission` | Admin JWT | Withdraw platform commission |
| `calculate-commute` | User JWT | Google Maps commute times |
| `get-maps-key` | User JWT | Securely retrieve Maps API key |

---

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: use [nvm](https://github.com/nvm-sh/nvm))
- A Supabase project ([supabase.com](https://supabase.com))

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Environment Variables

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |

### Supabase Edge Functions (Secrets)

| Secret | Description |
|---|---|
| `SUPABASE_URL` | Auto-provided by Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-provided by Supabase |
| `MPESA_CONSUMER_KEY` | Daraja API consumer key |
| `MPESA_CONSUMER_SECRET` | Daraja API consumer secret |
| `MPESA_SHORTCODE` | M-Pesa business shortcode |
| `MPESA_PASSKEY` | M-Pesa passkey for STK Push |
| `MPESA_ENVIRONMENT` | `sandbox` or `production` |
| `MPESA_B2C_INITIATOR_NAME` | B2C initiator username |
| `MPESA_B2C_SECURITY_CREDENTIAL` | B2C security credential |
| `MPESA_B2C_SHORTCODE` | B2C shortcode |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `GOOGLE_MAPS_API_KEY` | Google Maps Platform API key |

---

## Deployment

The app is deployed via [Lovable](https://lovable.dev):

1. Open the Lovable project
2. Click **Share → Publish**
3. Optionally connect a custom domain under **Project → Settings → Domains**

For custom deployments, run `npm run build` and serve the `dist/` folder with any static hosting provider (Vercel, Netlify, Cloudflare Pages, etc.).

---

## License

This project is proprietary. All rights reserved.
