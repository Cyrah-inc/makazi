

# Plan: WhatsApp Visibility + Subscription Gate + Security Fixes

## 1. WhatsApp Button: Mobile Visibility + Subscription Gate

**Problem**: The WhatsApp button is inside the sidebar's sticky card, which on mobile is pushed below the fold. Also, it should only show for landlords with active subscriptions.

**Changes to `src/pages/PropertyDetailPage.tsx`:**
- Add a new query to check if the landlord has an active subscription: query `subscriptions` table for the landlord's `user_id` where `status = 'active'` and `expires_at > now()`
- Only render `<WhatsAppButton>` when subscription is active AND phone exists
- Add a **fixed mobile WhatsApp floating button** at bottom-right (above bottom nav) that appears only on mobile (`md:hidden`), so mobile users can always reach it

**Changes to `src/components/chat/WhatsAppButton.tsx`:**
- No structural changes needed; the gating logic lives in the parent

## 2. Security Fix: Landlord PII Exposure

**Problem**: The `Public can view verified landlord profiles` RLS policy exposes `id_number`, `kra_pin`, `documents`, `business_phone` to everyone.

**Database migration:**
- Drop the existing overly-broad public SELECT policy
- Replace with a restrictive policy that only exposes `user_id` and `business_phone` (needed for WhatsApp) for verified landlords -- but actually, since we're gating WhatsApp behind subscription, we need `business_phone` readable
- Better approach: create a **database view** `public.landlord_public_profiles` that exposes only safe columns (`user_id`, `business_phone`, `verification_status`), and query that from the frontend instead
- Actually simpler: just replace the RLS policy with one that uses a security definer function to return only safe fields

Simplest fix: Replace the public policy to only allow selecting `user_id` and `verification_status` columns. Since RLS can't restrict columns, create a **new view** `landlord_public_info` with only safe columns and query that instead. Then remove the public SELECT policy from `landlord_profiles`.

**Migration SQL:**
```sql
-- Remove dangerous public policy
DROP POLICY IF EXISTS "Public can view verified landlord profiles" ON public.landlord_profiles;

-- Create safe public view
CREATE VIEW public.landlord_public_info AS
SELECT user_id, verification_status, business_phone
FROM public.landlord_profiles
WHERE verification_status = 'verified';

-- Grant access
GRANT SELECT ON public.landlord_public_info TO anon, authenticated;
```

**Update `src/pages/PropertyDetailPage.tsx`**: Query `landlord_public_info` view instead of `landlord_profiles` for the WhatsApp phone lookup, joining with subscription check.

## 3. Security Fix: M-Pesa Callback Lacks Verification

**Problem**: `mpesa-callback` accepts any POST without verifying it came from Safaricom.

**Changes to `supabase/functions/mpesa-callback/index.ts`:**
- Add validation: check that the `CheckoutRequestID` matches a known pending booking before processing (already done)
- Add a shared secret header check: store a `MPESA_CALLBACK_SECRET` and require it in a custom header, or validate the request came from expected Safaricom IP ranges
- Since Safaricom doesn't provide HMAC signatures on STK callbacks, the practical approach is:
  1. Add an `MPESA_CALLBACK_SECRET` token appended to the callback URL as a query parameter
  2. Validate it in the function before processing
- Update `supabase/functions/mpesa-stk-push/index.ts` to append the secret to the callback URL

**Same fix for `mpesa-b2c-callback`.**

## 4. Security Fix: Bookings Phone Exposure

**Problem**: `guest_phone` and `landlord_phone` in bookings could be exposed.

**Current RLS**: Guests see own bookings, landlords see their property bookings, admins see all. This is appropriate -- both parties in a booking should see each other's phone. No change needed as the policies are already scoped correctly.

## 5. Security Fix: Landlord Documents Bucket Historical Exposure

**Problem**: Documents uploaded during the brief public period may have been accessed.

**Action**: This is an audit recommendation, not a code fix. The bucket is already private. We'll note this in the plan but no code change is needed -- just inform the user.

---

## Files Summary

| File | Change |
|------|--------|
| `src/pages/PropertyDetailPage.tsx` | Add subscription check query; add mobile floating WhatsApp button; use safe view for phone lookup |
| `supabase/functions/mpesa-callback/index.ts` | Add callback secret validation |
| `supabase/functions/mpesa-b2c-callback/index.ts` | Add callback secret validation |
| `supabase/functions/mpesa-stk-push/index.ts` | Append secret to callback URL |
| Database migration | Drop public landlord_profiles policy; create `landlord_public_info` view |
| New secret | `MPESA_CALLBACK_SECRET` -- a random token for webhook verification |

**Note to user**: The `landlord-documents` bucket was briefly public between two migrations. If any documents were uploaded during that window, they may have been accessed. The bucket is now private and secure. If this is a production system with real landlord data from that period, consider notifying affected landlords.

