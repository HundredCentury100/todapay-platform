
-- Trigger function: notify user when a new voucher is created
CREATE OR REPLACE FUNCTION public.notify_new_voucher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_discount_text TEXT;
BEGIN
  IF NEW.discount_type = 'percentage' THEN
    v_discount_text := NEW.discount_value || '% off';
  ELSE
    v_discount_text := '$' || NEW.discount_value || ' off';
  END IF;

  INSERT INTO user_notifications (user_id, title, message, type, category, metadata)
  VALUES (
    NEW.user_id,
    'New Voucher Received! 🎟️',
    'You received a ' || v_discount_text || ' voucher (' || NEW.code || '). ' || COALESCE(NEW.description, 'Use it at checkout!'),
    'voucher',
    'promotion',
    jsonb_build_object(
      'type', 'voucher_received',
      'voucher_id', NEW.id,
      'voucher_code', NEW.code,
      'discount_type', NEW.discount_type,
      'discount_value', NEW.discount_value,
      'source', NEW.source,
      'expires_at', NEW.expires_at
    )
  );

  RETURN NEW;
END;
$$;

-- Attach trigger to user_vouchers table
DROP TRIGGER IF EXISTS trg_notify_new_voucher ON public.user_vouchers;
CREATE TRIGGER trg_notify_new_voucher
  AFTER INSERT ON public.user_vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_voucher();

-- Function to send expiry warnings (called by cron edge function)
CREATE OR REPLACE FUNCTION public.notify_expiring_vouchers()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER := 0;
  v_voucher RECORD;
  v_discount_text TEXT;
BEGIN
  FOR v_voucher IN
    SELECT uv.*
    FROM user_vouchers uv
    WHERE uv.status = 'active'
      AND uv.expires_at IS NOT NULL
      AND uv.expires_at BETWEEN now() AND now() + interval '48 hours'
      AND NOT EXISTS (
        SELECT 1 FROM user_notifications un
        WHERE un.user_id = uv.user_id
          AND un.type = 'voucher'
          AND (un.metadata->>'type') = 'voucher_expiring'
          AND (un.metadata->>'voucher_id')::uuid = uv.id
      )
  LOOP
    IF v_voucher.discount_type = 'percentage' THEN
      v_discount_text := v_voucher.discount_value || '% off';
    ELSE
      v_discount_text := '$' || v_voucher.discount_value || ' off';
    END IF;

    INSERT INTO user_notifications (user_id, title, message, type, category, action_url, metadata)
    VALUES (
      v_voucher.user_id,
      'Voucher Expiring Soon ⏰',
      'Your ' || v_discount_text || ' voucher (' || v_voucher.code || ') expires in less than 48 hours. Use it before it''s gone!',
      'voucher',
      'promotion',
      '/vouchers',
      jsonb_build_object(
        'type', 'voucher_expiring',
        'voucher_id', v_voucher.id,
        'voucher_code', v_voucher.code,
        'expires_at', v_voucher.expires_at
      )
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
