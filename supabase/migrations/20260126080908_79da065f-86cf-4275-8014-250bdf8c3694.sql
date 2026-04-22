-- Security Hardening Migration - Corrected
-- Tighten overly permissive RLS policies (only for tables that exist)

-- 1. Fix exchange_rates - restrict write access to service role only
DROP POLICY IF EXISTS "System can manage exchange rates" ON public.exchange_rates;
CREATE POLICY "Service role can manage exchange rates" 
ON public.exchange_rates FOR ALL 
TO service_role
USING (true) WITH CHECK (true);

-- 2. Fix consumer_analytics - restrict write access
DROP POLICY IF EXISTS "System can manage consumer analytics" ON public.consumer_analytics;
CREATE POLICY "Service role can manage consumer analytics" 
ON public.consumer_analytics FOR ALL 
TO service_role
USING (true) WITH CHECK (true);

-- 3. Fix credit_wallets - restrict to service role for writes
DROP POLICY IF EXISTS "System can manage wallets" ON public.credit_wallets;
CREATE POLICY "Service role can manage wallets" 
ON public.credit_wallets FOR ALL 
TO service_role
USING (true) WITH CHECK (true);

-- 4. Fix credit_transactions - restrict inserts
DROP POLICY IF EXISTS "System can insert transactions" ON public.credit_transactions;
CREATE POLICY "Service role can insert transactions" 
ON public.credit_transactions FOR INSERT 
TO service_role
WITH CHECK (true);

-- 5. Fix check_ins - allow service role
DROP POLICY IF EXISTS "Anyone can create check-ins" ON public.check_ins;
CREATE POLICY "Service role can create check-ins" 
ON public.check_ins FOR INSERT 
TO service_role
WITH CHECK (true);

-- 6. Fix check_outs - restrict updates to service role
DROP POLICY IF EXISTS "System can update check-outs" ON public.check_outs;
CREATE POLICY "Service role can update check-outs" 
ON public.check_outs FOR UPDATE 
TO service_role
USING (true);

-- 7. Fix venue_quotes - require email validation
DROP POLICY IF EXISTS "Anyone can create venue quotes" ON public.venue_quotes;
CREATE POLICY "Users can create venue quotes with their email" 
ON public.venue_quotes FOR INSERT 
WITH CHECK (customer_email IS NOT NULL AND customer_email != '');

-- 8. Fix merchant_chat_messages validation
DROP POLICY IF EXISTS "Anyone can send messages" ON public.merchant_chat_messages;
CREATE POLICY "Anyone can send chat messages" 
ON public.merchant_chat_messages FOR INSERT 
WITH CHECK (
  message IS NOT NULL AND 
  LENGTH(message) <= 2000 AND
  merchant_profile_id IS NOT NULL
);

-- 9. Fix split_payment_contributions - restrict to service role
DROP POLICY IF EXISTS "System can create contributions" ON public.split_payment_contributions;
DROP POLICY IF EXISTS "System can update contributions" ON public.split_payment_contributions;
CREATE POLICY "Service role can manage contributions" 
ON public.split_payment_contributions FOR ALL 
TO service_role
USING (true) WITH CHECK (true);

-- 10. Fix payment_verifications - restrict to service role
DROP POLICY IF EXISTS "System can insert payment verifications" ON public.payment_verifications;
DROP POLICY IF EXISTS "System can update payment verifications" ON public.payment_verifications;
CREATE POLICY "Service role can manage payment verifications" 
ON public.payment_verifications FOR ALL 
TO service_role
USING (true) WITH CHECK (true);

-- 11. Fix cron_job_history - restrict to service role
DROP POLICY IF EXISTS "System can insert job history" ON public.cron_job_history;
DROP POLICY IF EXISTS "System can update job history" ON public.cron_job_history;
CREATE POLICY "Service role can manage job history" 
ON public.cron_job_history FOR ALL 
TO service_role
USING (true) WITH CHECK (true);

-- 12. Fix seats update policy - restrict to service role
DROP POLICY IF EXISTS "System can update seats" ON public.seats;
CREATE POLICY "Service role can update seats" 
ON public.seats FOR UPDATE 
TO service_role
USING (true) WITH CHECK (true);

-- 13. Fix event_seats update policy - restrict to service role
DROP POLICY IF EXISTS "System can update event seats" ON public.event_seats;
CREATE POLICY "Service role can update event seats" 
ON public.event_seats FOR UPDATE 
TO service_role
USING (true) WITH CHECK (true);

-- 14. Fix merchant_account_sequences - restrict to service role
DROP POLICY IF EXISTS "System can manage sequences" ON public.merchant_account_sequences;
CREATE POLICY "Service role can manage sequences" 
ON public.merchant_account_sequences FOR ALL 
TO service_role
USING (true) WITH CHECK (true);

-- 15. Fix ticket_shares - restrict updates to service role
DROP POLICY IF EXISTS "System can update ticket shares" ON public.ticket_shares;
CREATE POLICY "Service role can update ticket shares" 
ON public.ticket_shares FOR UPDATE 
TO service_role
USING (true);

-- 16. Fix ad_impressions - restrict to service role
DROP POLICY IF EXISTS "System can insert impressions" ON public.ad_impressions;
CREATE POLICY "Service role can insert impressions" 
ON public.ad_impressions FOR INSERT 
TO service_role
WITH CHECK (true);

-- 17. Fix ad_clicks - restrict to service role
DROP POLICY IF EXISTS "System can insert clicks" ON public.ad_clicks;
CREATE POLICY "Service role can insert clicks" 
ON public.ad_clicks FOR INSERT 
TO service_role
WITH CHECK (true);

-- 18. Fix agent_referrals - restrict to service role
DROP POLICY IF EXISTS "System can insert referrals" ON public.agent_referrals;
CREATE POLICY "Service role can insert referrals" 
ON public.agent_referrals FOR INSERT 
TO service_role
WITH CHECK (true);

-- 19. Fix agent_override_commissions - restrict to service role
DROP POLICY IF EXISTS "System can insert override commissions" ON public.agent_override_commissions;
CREATE POLICY "Service role can insert override commissions" 
ON public.agent_override_commissions FOR INSERT 
TO service_role
WITH CHECK (true);

-- 20. Fix user_wallets - restrict to service role
DROP POLICY IF EXISTS "System can insert wallets" ON public.user_wallets;
CREATE POLICY "Service role can insert wallets" 
ON public.user_wallets FOR INSERT 
TO service_role
WITH CHECK (true);

-- 21. Fix user_wallet_transactions - restrict to service role
DROP POLICY IF EXISTS "System can insert transactions" ON public.user_wallet_transactions;
CREATE POLICY "Service role can insert wallet transactions" 
ON public.user_wallet_transactions FOR INSERT 
TO service_role
WITH CHECK (true);

-- 22. Fix user_notifications - restrict to service role
DROP POLICY IF EXISTS "System can insert notifications" ON public.user_notifications;
CREATE POLICY "Service role can insert notifications" 
ON public.user_notifications FOR INSERT 
TO service_role
WITH CHECK (true);

-- 23. Fix notification_log - restrict to service role
DROP POLICY IF EXISTS "System can insert logs" ON public.notification_log;
CREATE POLICY "Service role can insert logs" 
ON public.notification_log FOR INSERT 
TO service_role
WITH CHECK (true);

-- 24. Fix agent_commissions - restrict to service role
DROP POLICY IF EXISTS "System can create commissions" ON public.agent_commissions;
CREATE POLICY "Service role can create commissions" 
ON public.agent_commissions FOR INSERT 
TO service_role
WITH CHECK (true);

-- 25. Fix merchant_activity_logs - restrict to service role
DROP POLICY IF EXISTS "System can insert activity logs" ON public.merchant_activity_logs;
CREATE POLICY "Service role can insert activity logs" 
ON public.merchant_activity_logs FOR INSERT 
TO service_role
WITH CHECK (true);

-- 26. Fix ride_receipts - restrict to service role
DROP POLICY IF EXISTS "System can create receipts" ON public.ride_receipts;
CREATE POLICY "Service role can create receipts" 
ON public.ride_receipts FOR INSERT 
TO service_role
WITH CHECK (true);

-- 27. Fix failed_login_attempts - restrict to service role
DROP POLICY IF EXISTS "System can log failures" ON public.failed_login_attempts;
CREATE POLICY "Service role can log failures" 
ON public.failed_login_attempts FOR INSERT 
TO service_role
WITH CHECK (true);