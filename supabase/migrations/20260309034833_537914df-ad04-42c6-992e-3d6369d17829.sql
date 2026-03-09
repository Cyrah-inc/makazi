
-- 1. Remove "Service role updates withdrawals" from admin_withdrawals
DROP POLICY IF EXISTS "Service role updates withdrawals" ON public.admin_withdrawals;

-- 2. Remove "Authenticated users can view all profiles" from profiles
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- 3. Remove "Authenticated users can view subscriptions" from subscriptions
DROP POLICY IF EXISTS "Authenticated users can view subscriptions" ON public.subscriptions;

-- 4. Remove "Service role inserts notifications" from notifications
DROP POLICY IF EXISTS "Service role inserts notifications" ON public.notifications;

-- 5. Remove "Service role inserts payouts" and "Service role updates payouts" from payouts
DROP POLICY IF EXISTS "Service role inserts payouts" ON public.payouts;
DROP POLICY IF EXISTS "Service role updates payouts" ON public.payouts;
