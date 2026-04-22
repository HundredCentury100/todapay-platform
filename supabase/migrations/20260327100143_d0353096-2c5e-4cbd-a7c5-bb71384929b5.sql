CREATE OR REPLACE FUNCTION public.deduct_sponsored_ad_budget(ad_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE sponsored_telegram_ads
  SET budget_remaining = GREATEST(budget_remaining - cost_per_send, 0),
      total_sends = total_sends + 1
  WHERE id = ad_id AND budget_remaining > 0;
$$;