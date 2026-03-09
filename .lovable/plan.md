
## Plan: Redesigned Signup + Agent Onboarding + Enhanced Pending Approvals

### Overview of Changes

**4 major areas:**
1. **Simplified signup** — remove landlord option from sign-up form; all new users start as `user`
2. **"Become an Agent" onboarding** — a multi-step flow at `/become-agent` where regular users can upgrade by submitting their documents. After completion, they see a "pending verification" page
3. **Role upgrade on admin approval** — when admin verifies a landlord-applicant, the system promotes their `user_roles` entry from `user` → `landlord`
4. **Enhanced PendingApprovals widget** — two tabbed sections: pending properties + pending landlord applications

---

### Database Changes

One migration needed:

- Add a `landlord_applications` table (or reuse `landlord_profiles` with a new `applied_as_landlord` boolean flag) to track users who have applied via the "Become an Agent" flow but don't yet have the landlord role.

Actually, the existing `landlord_profiles` table already supports this perfectly:
- `verification_status = 'pending'` = awaiting admin review
- The user still has `role = 'user'` in `user_roles`

The key change: **the `LandlordLayout` currently blocks non-landlords**. The onboarding page will be a standalone page (not under `/landlord`), so no layout guard is needed until approval.

**Migration**: Add RLS policy so regular `user` role can INSERT/SELECT their own `landlord_profiles` row (currently only `landlord` role can do this).

---

### Files to Create

**1. `/become-agent` onboarding page** — `src/pages/BecomeAgentPage.tsx`
- Multi-step wizard (3 steps):
  - **Step 1**: Business phone (WhatsApp-connected)
  - **Step 2**: National ID number + front/back photo upload (2 files)
  - **Step 3**: KRA PIN + certificate upload
- On completion: show "Pending Verification" success screen
- If user already has `verification_status = 'pending'` or `'verified'`, show the current status instead of the form
- Uses `SingleDocumentUpload` component (already exists)
- Saves to `landlord_profiles` (upsert) with `verification_status = 'pending'`
- Also inserts a `notifications` row for the admin (optional)

**2. Admin Pending Landlord Applications component** — `src/components/admin/PendingLandlordApplications.tsx`
- Lists users who have a `landlord_profiles` row with `verification_status = 'pending'` but whose `user_roles.role = 'user'` (i.e., applied via "Become Agent")
- Each row shows: name, email, phone, submitted docs, Approve/Reject buttons
- **Approve** action: update `landlord_profiles.verification_status = 'verified'` AND upsert `user_roles` to set `role = 'landlord'` AND create `landlord_profiles` row if missing
- **Reject** action: update `landlord_profiles.verification_status = 'rejected'`
- Links to existing `LandlordDetailModal` for full detail view

---

### Files to Modify

**3. `AuthPage.tsx`** — Remove the account type radio (User vs Landlord). All signups → `user`. Clean up the sign-up form.

**4. `PendingApprovals.tsx`** — Add a second section/tab for pending landlord verifications below the existing properties section. Import and render `PendingLandlordApplications` inside the same card using Tabs.

**5. `Navbar.tsx`** — In the user dropdown/mobile menu, add a "Become an Agent" button linking to `/become-agent` for users who are `!isLandlord && !isAdmin`. If user has already applied (`verification_status = 'pending'`), show "Verification Pending" instead. If `isLandlord`, show "Landlord Dashboard" (already exists).

**6. `UserDashboard.tsx`** — Add an "Become an Agent" CTA card in the Quick Actions section (similar to the existing Browse Properties card).

**7. `App.tsx`** — Add lazy route for `BecomeAgentPage` at `/become-agent`.

**8. `DashboardBreadcrumb.tsx`** — Add `/become-agent` to user breadcrumb map.

**9. `useAuth.tsx`** — Remove `accountType` parameter from `signUp` (or default to `'user'` only — already defaults to `'user'` so mostly a cleanup). `signUp` always passes `account_type: 'user'`.

**10. RLS Migration** — Allow users with role `user` to insert/select their own `landlord_profiles` row so the onboarding form can save data.

---

### Flow Diagram

```text
SIGN UP (simplified)
  → All users get role: 'user'
  → Redirected to home

USER DASHBOARD / NAVBAR
  → "Become an Agent" CTA (only visible if !isLandlord && !isAdmin)
  → If already pending: button shows "Pending Verification"

/become-agent  (BecomeAgentPage)
  Step 1: WhatsApp Business Phone
  Step 2: ID Number + ID front/back upload
  Step 3: KRA PIN + KRA certificate
  → On submit: upsert landlord_profiles { verification_status: 'pending' }
  → Show: "Your application is under review" screen

ADMIN DASHBOARD - Pending Approvals widget
  Tab 1: Pending Properties (existing)
  Tab 2: Landlord Applications (NEW)
    → Shows users who applied via /become-agent
    → Approve → set landlord_profiles.verified + upsert user_roles.role = 'landlord'
    → Reject → set landlord_profiles.rejected + notes

USER (after approval)
  → role refreshed to 'landlord'
  → Navbar: "Become an Agent" → becomes "Landlord Dashboard"
  → Access to /landlord/* as verified landlord
```

---

### Technical Notes

- The `useAuth` hook fetches role from `user_roles` on sign-in. After admin approval, the user needs to refresh their session (sign out/in) OR we can add a "Refresh my status" button on the `/become-agent` pending screen that re-fetches their role using `roleFetchedForRef.current = null` + re-call `fetchUserRole`.
- The `landlord_profiles` RLS currently only allows `landlord` role to insert. The migration needs to add a policy allowing `authenticated` users to insert/select their own row (needed for the onboarding flow before they have the landlord role).
- The ID upload allows 2 files (front + back). We'll use the existing `SingleDocumentUpload` twice and store both paths in the `documents` array at index 0 and 1, with the KRA certificate at index 2. This differs from the existing 3-doc setup (ID doc at 0, KRA at 1). We'll keep it compatible.
- `LandlordDetailModal` already handles the full verification flow and is reusable in the admin pending widget.
