

# Plan: Multi-Unit Rent Pricing, Office Spaces, Google OAuth Fix, and Mobile Navigation

This plan covers three areas: (1) enhancing the rent section for multi-unit buildings and adding office space, (2) fixing the Google OAuth 403 error, and (3) improving mobile bottom navigation accessibility.

---

## 1. Multi-Unit Rental Pricing and Office Spaces

### What changes

Currently, the "For Rent" section in the Add/Edit Property form has a single "Monthly Rent" field. For apartment buildings with multiple unit types (e.g., 5 bedsitters, 10 one-bedrooms, 3 two-bedrooms), landlords need to specify pricing per unit type.

**A. Add a "rental units" system to the rent section:**
- When "For Rent" is checked AND category is "apartment" or "commercial", show an option to toggle "Multi-Unit Property"
- When enabled, display a dynamic list where landlords can add unit types:
  - Unit type (Bedsitter, 1 Bedroom, 2 Bedroom, 3 Bedroom, Studio, Office Space, etc.)
  - Number of units available
  - Monthly rent per unit (KES)
- The `monthly_rent` field will store the lowest rent as the headline price
- Unit details will be stored in the existing `description` field as structured text, or preferably in a new JSONB column

**B. Add "Office Space" as a property category:**
- Add `{ value: 'office', label: 'Office Space', icon: Briefcase }` to `propertyCategories` in both AddPropertyPage and EditPropertyPage
- This allows landlords to list dedicated office spaces for rent

### Database change

A new migration to add a `rental_units` JSONB column to the `properties` table:
```sql
ALTER TABLE public.properties 
ADD COLUMN rental_units jsonb DEFAULT NULL;
```

The JSONB structure will be:
```json
[
  { "type": "Bedsitter", "count": 5, "rent": 15000 },
  { "type": "1 Bedroom", "count": 10, "rent": 25000 },
  { "type": "2 Bedroom", "count": 3, "rent": 35000 }
]
```

### Files to modify
- `src/pages/landlord/AddPropertyPage.tsx` -- Add multi-unit UI in rent section, add "Office Space" category
- `src/pages/landlord/EditPropertyPage.tsx` -- Same changes for edit flow
- `src/pages/PropertyDetailPage.tsx` -- Display unit breakdown on property detail page
- `src/types/property.ts` -- Add `rentalUnits` field to Property interface

---

## 2. Google OAuth 403 Error Fix

### The Problem

The screenshot shows Google's "403 - You do not have access to this page" error. This happens when the Google OAuth consent screen or credentials are misconfigured. Specifically:

- The **Authorized redirect URI** in Google Cloud Console does not include the Supabase callback URL
- Or the OAuth consent screen is in "Testing" mode with restricted test users

### The Fix

This is a **configuration issue** in the Google Cloud Console, not a code issue. The code at line 82-87 of AuthPage.tsx is correct. You need to:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) > APIs & Credentials > OAuth 2.0 Client IDs
2. Ensure **Authorized redirect URIs** includes: `https://wbveiqffiooxaujccajq.supabase.co/auth/v1/callback`
3. Ensure **Authorized JavaScript origins** includes your app URLs:
   - `https://makazi.lovable.app`
   - `https://17432d3a-7189-414a-a058-083823c358d5.lovableproject.com`
4. Go to OAuth consent screen and either:
   - Add your Google account as a test user (if in "Testing" mode), OR
   - Publish the app to move out of "Testing" mode

5. In Supabase Dashboard > Authentication > URL Configuration, ensure:
   - **Site URL** is set to `https://makazi.lovable.app`
   - **Redirect URLs** includes `https://makazi.lovable.app/**` and `https://17432d3a-7189-414a-a058-083823c358d5.lovableproject.com/**`

No code changes needed for this item.

---

## 3. Mobile Bottom Navigation Improvements

### The Problem

The bottom nav currently **hides on all `/dashboard/*` routes** (line 24-28 of BottomNav.tsx), which means "Saved" (favorites) and "Chats" pages lose the bottom navigation since they live at `/dashboard/favorites` and `/dashboard/chats`.

### The Fix

- Keep the bottom nav visible on user dashboard sub-pages (`/dashboard/*`) since users need quick access to Saved and Chats
- Only hide on `/admin/*` and `/landlord/*` routes (which have their own sidebar nav)
- Ensure the BottomNav links for "Saved" and "Chats" correctly highlight as active on their respective pages

### Files to modify
- `src/components/BottomNav.tsx` -- Remove `/dashboard` from the hide condition, keep it visible on user dashboard pages
- `src/components/user/UserLayout.tsx` -- Add bottom padding on mobile to prevent content from being hidden behind the bottom nav

---

## Technical Summary

| Task | Type | Files |
|------|------|-------|
| Multi-unit rental pricing | DB migration + UI | AddPropertyPage, EditPropertyPage, PropertyDetailPage, types/property.ts |
| Office Space category | UI only | AddPropertyPage, EditPropertyPage |
| Google OAuth 403 | Config only | Google Cloud Console + Supabase Dashboard (no code) |
| Mobile bottom nav | UI fix | BottomNav.tsx, UserLayout.tsx |

