CREATE TABLE IF NOT EXISTS public.telegram_promo_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  user_id uuid,
  slot text NOT NULL,
  sent_date date NOT NULL,
  promo_title text,
  role_targeted text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chat_id, sent_date, slot)
);

ALTER TABLE public.telegram_promo_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on telegram_promo_log"
  ON public.telegram_promo_log
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);