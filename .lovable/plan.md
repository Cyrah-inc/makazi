

## Problem

Three access barriers prevent logged-in users from seeing landlord info and WhatsApp on property detail pages:

1. **`profiles` table RLS** — only allows users to view their own profile. So the landlord name/avatar query silently returns null for non-admin visitors.
2. **`subscriptions` table RLS** — only allows landlords to view their own subscription and admins. Regular users can't check if a landlord has an active subscription.
3. **WhatsApp/phone visibility** — correctly gated behind `hasActiveSubscription`, but the subscription query fails due to RLS, so it always appears hidden.

## Plan

### 1. Add RLS policy: authenticated users can read any profile (database migration)
Allow any authenticated user to SELECT from `profiles`. This lets visitors see landlord name and avatar.

```sql
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);
```

### 2. Add RLS policy: authenticated users can check subscriptions (database migration)
Allow any authenticated user to SELECT from `subscriptions` so they can verify landlord subscription status.

```sql
CREATE POLICY "Authenticated users can view subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (true);
```

### 3. Update PropertyDetailPage to show phone and WhatsApp for all logged-in users

In `src/pages/PropertyDetailPage.tsx`:
- Show the landlord's phone number in the Agent Card for logged-in users when the landlord has an active subscription
- Keep WhatsApp button and floating mobile button visible to all logged-in users (still gated by subscription + phone availability)
- Add a visible phone number display in the Agent Card

No changes needed to the subscription or profile queries themselves — they already query the right data, they just fail silently due to RLS.

### Files changed

| File | Change |
|------|--------|
| Migration SQL | Two new SELECT policies on `profiles` and `subscriptions` |
| `src/pages/PropertyDetailPage.tsx` | Add phone number display in Agent Card; keep existing WhatsApp logic (now works because RLS allows the queries) |

