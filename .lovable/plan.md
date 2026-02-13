
# Redesign: Jiji-Inspired Chat System + WhatsApp Integration

## Overview
Merge the separate "Messages" and "Inquiries" systems into a single, unified chat experience inspired by Jiji.co.ke. On Jiji, when you tap "Chat" on a listing, it opens a conversation thread tied to that product -- no separate inbox/inquiries distinction. We'll replicate this pattern. Additionally, property detail pages for Buy and Rent listings will get a WhatsApp "Chat with us" button that opens a pre-filled WhatsApp message to the landlord.

## What Changes

### 1. Property Detail Page -- Jiji-Style "Start Chat" + WhatsApp Button
Replace the current `InquiryForm` dialog with a streamlined inline chat input (like Jiji's "Start chatting to buy this product" bar) and add a WhatsApp button:

- **Inline Chat Bar**: A text input with a send button directly in the sidebar card. Typing and sending creates a new conversation thread (or appends to an existing one for the same property+user pair).
- **WhatsApp Button**: A green "Chat on WhatsApp" button that opens `https://wa.me/{phone}?text={pre-filled message}` in a new tab. The phone number comes from the landlord's profile (`business_phone` from `landlord_profiles` table, or `phone` from `profiles` table).
- **Quick Prompt Chips**: Pre-filled message suggestions like "Is this still available?", "Can I schedule a viewing?", "What's the best price?" -- tapping one fills the input.

### 2. Unified Chat System (Replace Messages + Inquiries Pages)
Merge the user's `/dashboard/messages` and `/dashboard/inquiries` pages into a single `/dashboard/chats` page. Same for landlord: merge `/landlord/messages` and `/landlord/inquiries` into `/landlord/chats`.

**Chat List View (left panel)**:
- Each conversation is grouped by property + other user pair
- Shows property thumbnail, other user's name, last message preview, timestamp, unread badge
- Conversations sorted by most recent message

**Chat Thread View (right panel / full screen on mobile)**:
- Bubble-style message thread (sent messages right-aligned, received left-aligned)
- Property context card pinned at the top of the thread
- Text input at the bottom with send button
- Real-time updates via Supabase subscription

### 3. Data Layer Changes
The existing `messages` table already has `sender_id`, `recipient_id`, `property_id`, `content`, `subject`, `is_read`, and `created_at`. We'll use it as the conversation store. Inquiries from the `inquiries` table remain for legacy data but new conversations go through `messages`.

**New database migration**: Add a `conversation_id` column to `messages` to group messages into threads. A conversation is uniquely identified by `(property_id, participant_1, participant_2)`.

New table: `conversations`
- `id` (uuid, PK)
- `property_id` (uuid, nullable)
- `participant_1` (uuid) -- always the lesser UUID for consistency
- `participant_2` (uuid)
- `last_message_at` (timestamptz)
- `last_message_preview` (text)
- `created_at` (timestamptz)

RLS policies:
- SELECT: where auth.uid() = participant_1 OR auth.uid() = participant_2
- INSERT: where auth.uid() = participant_1 OR auth.uid() = participant_2

Update `messages` table: add `conversation_id` (uuid, FK to conversations).

### 4. Navigation Updates
- **User Sidebar**: Replace "Messages" and "My Inquiries" with a single "Chats" item
- **Landlord Sidebar**: Replace "Messages" and "Inquiries" with a single "Chats" item
- **Bottom Nav**: "Messages" label stays but routes to `/dashboard/chats`
- **Routes**: Add `/dashboard/chats` and `/landlord/chats`, keep old routes as redirects

## Technical Details

### Database Migration
Create `conversations` table and add `conversation_id` to `messages`:

```sql
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  participant_1 uuid NOT NULL,
  participant_2 uuid NOT NULL,
  last_message_at timestamptz DEFAULT now(),
  last_message_preview text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, participant_1, participant_2)
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

ALTER TABLE messages ADD COLUMN conversation_id uuid REFERENCES conversations(id);
```

### Files to Create
- `src/components/chat/ChatList.tsx` -- Conversation list component (property thumbnail, last message, unread count)
- `src/components/chat/ChatThread.tsx` -- Bubble-style message thread with input
- `src/components/chat/ChatPropertyCard.tsx` -- Small property context card at top of thread
- `src/components/chat/QuickPrompts.tsx` -- Quick message chips ("Is this available?", etc.)
- `src/components/chat/WhatsAppButton.tsx` -- Green WhatsApp CTA button
- `src/components/chat/InlineChatInput.tsx` -- Inline chat bar for property detail sidebar
- `src/hooks/useConversations.ts` -- Hook for fetching/managing conversations
- `src/hooks/useChat.ts` -- Hook for fetching messages in a thread + sending
- `src/pages/user/UserChatsPage.tsx` -- Unified user chat page
- `src/pages/landlord/LandlordChatsPage.tsx` -- Unified landlord chat page

### Files to Modify
- `src/pages/PropertyDetailPage.tsx` -- Replace InquiryForm with InlineChatInput + WhatsAppButton + QuickPrompts
- `src/components/user/UserSidebar.tsx` -- Merge Messages + Inquiries into single "Chats" nav item
- `src/components/landlord/LandlordSidebar.tsx` -- Merge Messages + Inquiries into single "Chats" nav item
- `src/components/BottomNav.tsx` -- Update Messages link to /dashboard/chats
- `src/App.tsx` -- Add new chat routes, redirect old message/inquiry routes
- `src/types/message.ts` -- Add Conversation type

### WhatsApp Integration
The WhatsApp button constructs a URL like:
```
https://wa.me/254XXXXXXXXX?text=Hi, I'm interested in [Property Title] listed on Makazi. Is it still available?
```
The phone number is fetched from `landlord_profiles.business_phone` or `profiles.phone`. If no phone is available, the WhatsApp button is hidden and only in-app chat is shown.

### Chat Thread UI (Jiji-inspired)
- Messages displayed as chat bubbles (green/primary for sent, gray/muted for received)
- Timestamps shown between message groups (grouped by day)
- Property card pinned at top showing thumbnail, title, price
- Input bar fixed at bottom with text field + send icon
- Mobile: full-screen thread view with back arrow; Desktop: side-by-side list + thread
