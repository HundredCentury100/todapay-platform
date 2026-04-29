
CREATE TABLE public.sms_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'signin',
  email TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sms_otp_phone_purpose ON public.sms_otp_codes (phone, purpose, created_at DESC);

ALTER TABLE public.sms_otp_codes ENABLE ROW LEVEL SECURITY;

-- No policies: only service role (edge functions) can read/write.
