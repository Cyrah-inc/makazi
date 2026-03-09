
-- ============================================================
-- FIX 1: Recreate ALL policies as PERMISSIVE (drop all first)
-- PostgreSQL default is PERMISSIVE; RESTRICTIVE requires explicit keyword
-- ============================================================

-- admin_withdrawals
DROP POLICY IF EXISTS "Admins can insert withdrawals" ON public.admin_withdrawals;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.admin_withdrawals;
DROP POLICY IF EXISTS "Service role updates withdrawals" ON public.admin_withdrawals;

CREATE POLICY "Admins can insert withdrawals" ON public.admin_withdrawals
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all withdrawals" ON public.admin_withdrawals
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- bookings
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Guests can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Guests can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Guests can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Landlords can view property bookings" ON public.bookings;

CREATE POLICY "Admins can update all bookings" ON public.bookings
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all bookings" ON public.bookings
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Guests can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = guest_id);

CREATE POLICY "Guests can update own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = guest_id);

CREATE POLICY "Guests can view own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = guest_id);

CREATE POLICY "Landlords can view property bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = landlord_id);

-- conversations
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;

CREATE POLICY "Admins can view all conversations" ON public.conversations
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can create conversations" ON public.conversations
  FOR INSERT WITH CHECK ((auth.uid() = participant_1) OR (auth.uid() = participant_2));

CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING ((auth.uid() = participant_1) OR (auth.uid() = participant_2));

CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING ((auth.uid() = participant_1) OR (auth.uid() = participant_2));

-- favorites
DROP POLICY IF EXISTS "Admins can view all favorites" ON public.favorites;
DROP POLICY IF EXISTS "Landlords can view favorites for own properties" ON public.favorites;
DROP POLICY IF EXISTS "Users can add favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;

CREATE POLICY "Admins can view all favorites" ON public.favorites
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Landlords can view favorites for own properties" ON public.favorites
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = favorites.property_id AND properties.landlord_id = auth.uid()
  ));

CREATE POLICY "Users can add favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.favorites
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT USING (auth.uid() = user_id);

-- inquiries
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Landlords can reply to inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Landlords can view property inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Users can create inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Users can view own inquiries" ON public.inquiries;

CREATE POLICY "Admins can view all inquiries" ON public.inquiries
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Landlords can reply to inquiries" ON public.inquiries
  FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can view property inquiries" ON public.inquiries
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Users can create inquiries" ON public.inquiries
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view own inquiries" ON public.inquiries
  FOR SELECT USING (auth.uid() = sender_id);

-- landlord_profiles (deduplicate redundant policies)
DROP POLICY IF EXISTS "Admins can update all landlord profiles" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Admins can view all landlord profiles" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own landlord profile" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Authenticated users can update own landlord profile" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Authenticated users can view own landlord profile" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Landlords can insert own landlord profile" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Landlords can update own landlord profile" ON public.landlord_profiles;
DROP POLICY IF EXISTS "Landlords can view own landlord profile" ON public.landlord_profiles;

CREATE POLICY "Admins can update all landlord profiles" ON public.landlord_profiles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all landlord profiles" ON public.landlord_profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own landlord profile" ON public.landlord_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own landlord profile" ON public.landlord_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own landlord profile" ON public.landlord_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- leads
DROP POLICY IF EXISTS "Admins can view all leads" ON public.leads;
DROP POLICY IF EXISTS "Authenticated users can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Landlords can view own leads" ON public.leads;

CREATE POLICY "Admins can view all leads" ON public.leads
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can insert leads" ON public.leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Landlords can view own leads" ON public.leads
  FOR SELECT USING (auth.uid() = landlord_id);

-- messages
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark messages as read" ON public.messages;
DROP POLICY IF EXISTS "Senders can delete own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view sent messages" ON public.messages;

CREATE POLICY "Admins can view all messages" ON public.messages
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Recipients can mark messages as read" ON public.messages
  FOR UPDATE USING (auth.uid() = recipient_id);

CREATE POLICY "Senders can delete own messages" ON public.messages
  FOR DELETE USING (auth.uid() = sender_id);

CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view received messages" ON public.messages
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can view sent messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id);

-- notifications
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role inserts notifications" ON public.notifications;

CREATE POLICY "Admins can view all notifications" ON public.notifications
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

-- payouts
DROP POLICY IF EXISTS "Admins can insert payouts" ON public.payouts;
DROP POLICY IF EXISTS "Admins can view all payouts" ON public.payouts;
DROP POLICY IF EXISTS "Landlords can view own payouts" ON public.payouts;
DROP POLICY IF EXISTS "Service role inserts payouts" ON public.payouts;
DROP POLICY IF EXISTS "Service role updates payouts" ON public.payouts;

CREATE POLICY "Admins can insert payouts" ON public.payouts
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all payouts" ON public.payouts
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Landlords can view own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = landlord_id);

-- profiles
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- properties
DROP POLICY IF EXISTS "Admins can delete properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Landlords can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Landlords can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Landlords can view own properties" ON public.properties;
DROP POLICY IF EXISTS "Public can view approved properties" ON public.properties;

CREATE POLICY "Admins can delete properties" ON public.properties
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all properties" ON public.properties
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all properties" ON public.properties
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Landlords can insert own properties" ON public.properties
  FOR INSERT WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update own properties" ON public.properties
  FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can view own properties" ON public.properties
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Public can view approved properties" ON public.properties
  FOR SELECT USING (status = 'approved'::property_status);

-- reviews
DROP POLICY IF EXISTS "Admins can delete reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Guests can create reviews for own bookings" ON public.reviews;
DROP POLICY IF EXISTS "Guests can view own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Landlords can view reviews for their properties" ON public.reviews;
DROP POLICY IF EXISTS "Public can view all reviews" ON public.reviews;

CREATE POLICY "Admins can delete reviews" ON public.reviews
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all reviews" ON public.reviews
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Guests can create reviews for own bookings" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() = guest_id AND EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = reviews.booking_id
        AND bookings.guest_id = auth.uid()
        AND bookings.status = ANY (ARRAY['checked_in'::text, 'completed'::text])
    )
  );

CREATE POLICY "Guests can view own reviews" ON public.reviews
  FOR SELECT USING (auth.uid() = guest_id);

CREATE POLICY "Landlords can view reviews for their properties" ON public.reviews
  FOR SELECT USING (auth.uid() = landlord_id);

CREATE POLICY "Public can view all reviews" ON public.reviews
  FOR SELECT USING (true);

-- subscriptions
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Landlords can insert own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Landlords can update own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Landlords can view own subscription" ON public.subscriptions;
DROP POLICY IF EXISTS "Authenticated users can view subscriptions" ON public.subscriptions;

CREATE POLICY "Admins can update all subscriptions" ON public.subscriptions
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- FIX 2: Prevent subscription self-activation — only allow inserting with 'pending' status
CREATE POLICY "Landlords can insert own subscription" ON public.subscriptions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Landlords can only read their subscription (no client-side UPDATE — activation via edge function with service role)
CREATE POLICY "Landlords can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
