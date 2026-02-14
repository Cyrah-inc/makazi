

# Push Notifications, Typing Indicators, Chat Notifications, and WhatsApp Phone Field

## 1. Browser Push Notifications for New Messages

Create a `useChatNotifications` hook that runs globally (mounted in `App.tsx`). It will:
- Request browser notification permission on first login via `Notification.requestPermission()`
- Subscribe to Supabase realtime `INSERT` events on the `messages` table filtered by `recipient_id=eq.{userId}`
- When a new message arrives and the user is NOT on the chat page for that conversation, show a browser `Notification` with the sender's name and message preview
- Clicking the notification navigates to `/dashboard/chats?c={conversationId}`
- Only fires when `document.hidden === true` (tab not focused) or user is on a different page

**Files to create:**
- `src/hooks/useChatNotifications.ts`

**Files to modify:**
- `src/App.tsx` -- mount the hook inside the `AuthProvider` via a small `<ChatNotificationsProvider />` component

## 2. Real-Time Typing Indicators

Use Supabase Realtime **Presence** (broadcast channel) to share typing state between conversation participants. No database changes needed.

**How it works:**
- When user types in the chat input, broadcast a `typing` event on a presence channel `typing-{conversationId}`
- Debounce: send typing=true on keystroke, auto-clear after 2 seconds of inactivity
- The other participant listens on the same channel and shows a "typing..." indicator below the messages

**Files to create:**
- `src/hooks/useTypingIndicator.ts` -- handles broadcasting and listening for typing events

**Files to modify:**
- `src/components/chat/ChatThread.tsx` -- add typing indicator UI below messages, call the hook on input changes

## 3. Chat Notification Badge (Unread Count in Nav)

Show an unread message count badge on the "Chats" nav item in sidebars and bottom nav.

**Files to create:**
- `src/hooks/useUnreadCount.ts` -- subscribes to realtime message inserts and queries unread count from `messages` table where `recipient_id = user.id AND is_read = false`

**Files to modify:**
- `src/components/BottomNav.tsx` -- show red badge with count on the Chats icon
- `src/components/user/UserSidebar.tsx` -- show badge next to "Chats" nav item
- `src/components/landlord/LandlordSidebar.tsx` -- show badge next to "Chats" nav item

## 4. Landlord Business Phone in Profile (WhatsApp Enablement)

The `business_phone` field already exists in the `landlord_profiles` table and is already editable in the `VerificationDetailsCard` component. The `PropertyDetailPage` already queries for it and conditionally shows the `WhatsAppButton`. No database changes needed.

However, the current RLS on `landlord_profiles` only allows landlords and admins to SELECT their own profiles. The `PropertyDetailPage` fetches the landlord's `business_phone` as a regular user, which will fail due to RLS.

**Fix needed:** Add an RLS policy allowing authenticated users to read the `business_phone` column from `landlord_profiles` for verified landlords. Since Postgres RLS is row-level (not column-level), we'll add a SELECT policy that allows any authenticated user to read rows where `verification_status = 'verified'`.

**Database migration:**
```sql
CREATE POLICY "Public can view verified landlord profiles"
  ON landlord_profiles FOR SELECT
  USING (verification_status = 'verified');
```

## Technical Summary

| Change | Type | Files |
|--------|------|-------|
| Browser push notifications | New hook + provider | `useChatNotifications.ts`, `App.tsx` |
| Typing indicators | New hook + UI update | `useTypingIndicator.ts`, `ChatThread.tsx` |
| Unread badge in nav | New hook + UI updates | `useUnreadCount.ts`, `BottomNav.tsx`, `UserSidebar.tsx`, `LandlordSidebar.tsx` |
| WhatsApp RLS fix | DB migration | Migration SQL |

No new tables or columns are required. One new RLS policy is needed for the WhatsApp feature to work correctly.

