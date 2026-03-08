

## Add User Notifications Page + Password Reset in Profiles

### 1. User Notifications Page (`/dashboard/notifications`)

Create a new page mirroring the existing `LandlordNotificationsPage` pattern but wrapped in `UserLayout`.

**Files to create/modify:**
- **New**: `src/pages/user/UserNotificationsPage.tsx` — same UI as `LandlordNotificationsPage` but using `UserLayout`
- **Edit**: `src/components/user/UserSidebar.tsx` — add "Notifications" nav item with `Bell` icon and unread badge (using `useUnreadNotificationCount`)
- **Edit**: `src/components/DashboardBreadcrumb.tsx` — add `{ path: '/dashboard/notifications', label: 'Notifications' }` to UserBreadcrumb routes
- **Edit**: `src/App.tsx` — add lazy import and route for `/dashboard/notifications`

### 2. Password Reset on Profile Pages

Add a "Change Password" section to both user and landlord profile pages. Uses `supabase.auth.updateUser({ password })` for logged-in users.

**UI**: A collapsible card/section with two fields (new password, confirm password) and a "Update Password" button. Shows success/error toast.

**Files to modify:**
- **Edit**: `src/pages/user/UserDashboard.tsx` — add a "Security" card below the profile card with password change form
- **Edit**: `src/pages/landlord/LandlordProfilePage.tsx` — add the same "Security" card

No database changes needed — Supabase auth handles password updates natively via `updateUser`.

### Technical Details

- Password reset uses `supabase.auth.updateUser({ password: newPassword })` which works for any authenticated user regardless of role
- Minimum password length validation (6 chars) and confirm-password match check before submission
- The notifications page reuses existing `useNotifications`, `useMarkNotificationRead`, `useMarkAllNotificationsRead` hooks

