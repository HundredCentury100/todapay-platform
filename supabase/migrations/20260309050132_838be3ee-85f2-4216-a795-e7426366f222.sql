
-- Tighten group_bookings
DROP POLICY IF EXISTS "Authenticated users can create group bookings" ON public.group_bookings;
CREATE POLICY "Authenticated users can create group bookings"
ON public.group_bookings FOR INSERT TO authenticated
WITH CHECK (true);

-- Tighten merchant chat messages
DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON public.merchant_chat_messages;
CREATE POLICY "Authenticated users can insert chat messages"
ON public.merchant_chat_messages FOR INSERT TO authenticated
WITH CHECK (true);

-- Tighten check_outs
DROP POLICY IF EXISTS "Authenticated users can create check-outs" ON public.check_outs;
CREATE POLICY "Authenticated users can create check-outs"
ON public.check_outs FOR INSERT TO authenticated
WITH CHECK (true);

-- Remove fully open guest venue quotes, require auth
DROP POLICY IF EXISTS "Guest venue quotes" ON public.venue_quotes;
DROP POLICY IF EXISTS "Authenticated venue quotes" ON public.venue_quotes;
CREATE POLICY "Authenticated venue quotes"
ON public.venue_quotes FOR INSERT TO authenticated
WITH CHECK (true);
