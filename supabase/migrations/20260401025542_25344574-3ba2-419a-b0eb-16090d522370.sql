-- 1. Fix active_rides: Remove public ALL policy, replace with service_role only
DROP POLICY IF EXISTS "System can manage active rides" ON public.active_rides;
CREATE POLICY "Service role can manage active rides"
  ON public.active_rides FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- 2. Fix surge_zones: restrict to service_role + authenticated read
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'surge_zones' AND policyname = 'System can manage surge zones') THEN
    DROP POLICY "System can manage surge zones" ON public.surge_zones;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'surge_zones' AND policyname = 'Service role can manage surge zones') THEN
    EXECUTE 'CREATE POLICY "Service role can manage surge zones" ON public.surge_zones FOR ALL TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'surge_zones' AND policyname = 'Authenticated users can read surge zones') THEN
    EXECUTE 'CREATE POLICY "Authenticated users can read surge zones" ON public.surge_zones FOR SELECT TO authenticated USING (true)';
  END IF;
END $$;

-- 3. Fix group_bookings: SELECT should require ownership
DROP POLICY IF EXISTS "Coordinators can view their group bookings" ON public.group_bookings;
CREATE POLICY "Coordinators can view their group bookings"
  ON public.group_bookings FOR SELECT
  TO authenticated
  USING (coordinator_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

DROP POLICY IF EXISTS "Authenticated users can create group bookings" ON public.group_bookings;
CREATE POLICY "Authenticated users can create group bookings"
  ON public.group_bookings FOR INSERT
  TO authenticated
  WITH CHECK (coordinator_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text);

-- 4. Fix telegram_messages: restrict to service_role only
DROP POLICY IF EXISTS "Authenticated users can read telegram messages" ON public.telegram_messages;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'telegram_messages' AND policyname = 'Service role can read telegram messages') THEN
    EXECUTE 'CREATE POLICY "Service role can read telegram messages" ON public.telegram_messages FOR SELECT TO service_role USING (true)';
  END IF;
END $$;

-- 5. Fix booking_actions: merchant UPDATE should verify ownership through operator
DROP POLICY IF EXISTS "Merchants can update booking actions" ON public.booking_actions;
CREATE POLICY "Merchants can update booking actions"
  ON public.booking_actions FOR UPDATE
  TO authenticated
  USING (
    booking_id IN (
      SELECT b.id FROM bookings b
      JOIN operator_associations oa ON oa.operator_name = b.operator
      JOIN merchant_profiles mp ON mp.id = oa.merchant_profile_id
      WHERE mp.user_id = auth.uid() AND mp.verification_status = 'verified'
    )
  );

DROP POLICY IF EXISTS "Users can create booking actions for their bookings" ON public.booking_actions;
CREATE POLICY "Users can create booking actions for their bookings"
  ON public.booking_actions FOR INSERT
  TO authenticated
  WITH CHECK (booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid()));

-- 6. Fix drivers: remove public anonymous access to PII
DROP POLICY IF EXISTS "Anyone can view online drivers" ON public.drivers;
CREATE POLICY "Authenticated users can view online drivers"
  ON public.drivers FOR SELECT
  TO authenticated
  USING ((is_online = true AND status = 'active') OR user_id = auth.uid());

-- 7. Fix check_ins: remove auth.uid() IS NULL bypass
DROP POLICY IF EXISTS "Users can view check-ins for their bookings" ON public.check_ins;
CREATE POLICY "Users can view check-ins for their bookings"
  ON public.check_ins FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = check_ins.booking_id
    AND bookings.user_id = auth.uid()
  ));

-- 8. Fix check_outs: remove auth.uid() IS NULL bypass
DROP POLICY IF EXISTS "Users can view check-outs for their bookings" ON public.check_outs;
CREATE POLICY "Users can view check-outs for their bookings"
  ON public.check_outs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = check_outs.booking_id
    AND bookings.user_id = auth.uid()
  ));

-- 9. Fix payment_plans: remove auth.uid() IS NULL bypass
DROP POLICY IF EXISTS "Users can view their payment plans" ON public.payment_plans;
CREATE POLICY "Users can view their payment plans"
  ON public.payment_plans FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = payment_plans.booking_id
    AND bookings.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update their payment plans" ON public.payment_plans;
CREATE POLICY "Users can update their payment plans"
  ON public.payment_plans FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = payment_plans.booking_id
    AND bookings.user_id = auth.uid()
  ));

-- 10. Fix telegram_user_links: tighten SELECT to own records only
DROP POLICY IF EXISTS "Users can find pending links by code" ON public.telegram_user_links;
CREATE POLICY "Users can view own telegram links"
  ON public.telegram_user_links FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());