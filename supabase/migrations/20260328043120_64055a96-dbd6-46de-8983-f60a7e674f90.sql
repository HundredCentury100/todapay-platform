-- 1. ADD RLS POLICIES FOR 3 TELEGRAM TABLES

CREATE POLICY "Service role full access to bot state"
  ON public.telegram_bot_state FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access to telegram messages"
  ON public.telegram_messages FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read telegram messages"
  ON public.telegram_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Service role full access to telegram sessions"
  ON public.telegram_sessions FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 2. TIGHTEN OVERLY PERMISSIVE NON-SERVICE-ROLE POLICIES

DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Authenticated users can create bookings"
  ON public.bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Guest users can create bookings"
  ON public.bookings FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

DROP POLICY IF EXISTS "Anonymous booking addons allowed" ON public.booking_addons;
CREATE POLICY "Anyone can create booking addons"
  ON public.booking_addons FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND (b.user_id = auth.uid() OR b.user_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create check-outs" ON public.check_outs;
CREATE POLICY "Authenticated users can create check-outs"
  ON public.check_outs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND b.user_id = auth.uid()
    )
  );

-- group_bookings: no user ownership column, restrict to authenticated only
DROP POLICY IF EXISTS "Authenticated users can create group bookings" ON public.group_bookings;
CREATE POLICY "Authenticated users can create group bookings"
  ON public.group_bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- merchant_chat_messages: no sender_id, restrict to authenticated
DROP POLICY IF EXISTS "Authenticated users can insert chat messages" ON public.merchant_chat_messages;
CREATE POLICY "Authenticated users can insert chat messages"
  ON public.merchant_chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- venue_quotes: no user_id column, restrict to authenticated
DROP POLICY IF EXISTS "Authenticated venue quotes" ON public.venue_quotes;
CREATE POLICY "Authenticated users can create venue quotes"
  ON public.venue_quotes FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Guest car bookings allowed" ON public.car_bookings;
CREATE POLICY "Guest car bookings allowed"
  ON public.car_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND (b.user_id = auth.uid() OR b.user_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Guest experience bookings" ON public.experience_bookings;
CREATE POLICY "Guest experience bookings"
  ON public.experience_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND (b.user_id = auth.uid() OR b.user_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Guest flight bookings" ON public.flight_bookings;
CREATE POLICY "Guest flight bookings"
  ON public.flight_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND (b.user_id = auth.uid() OR b.user_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Guest stay bookings" ON public.stay_bookings;
CREATE POLICY "Guest stay bookings"
  ON public.stay_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND (b.user_id = auth.uid() OR b.user_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Guest transfer bookings" ON public.transfer_bookings;
CREATE POLICY "Guest transfer bookings"
  ON public.transfer_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND (b.user_id = auth.uid() OR b.user_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Guest venue bookings" ON public.venue_bookings;
CREATE POLICY "Guest venue bookings"
  ON public.venue_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND (b.user_id = auth.uid() OR b.user_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Guest workspace bookings" ON public.workspace_bookings;
CREATE POLICY "Guest workspace bookings"
  ON public.workspace_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b 
      WHERE b.id = booking_id 
      AND (b.user_id = auth.uid() OR b.user_id IS NULL)
    )
  );

-- 3. FIX 4 FUNCTIONS MISSING search_path

CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;