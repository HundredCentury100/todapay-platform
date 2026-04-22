
-- Add missing columns to user_notifications for full notification integration
ALTER TABLE public.user_notifications 
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS attachment_url text,
  ADD COLUMN IF NOT EXISTS metadata jsonb;
