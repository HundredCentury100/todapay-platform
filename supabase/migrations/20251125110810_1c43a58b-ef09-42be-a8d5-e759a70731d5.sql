-- Phase 1: Fix Critical Security Issues

-- 1. Fix bookings table - remove public read access policy
DROP POLICY IF EXISTS "Anyone can view bookings" ON public.bookings;

-- 2. Create proper booking access policies
CREATE POLICY "Users can view their own bookings"
  ON public.bookings FOR SELECT
  USING (
    auth.uid() = user_id 
    OR guest_email = auth.jwt()->>'email'
  );

CREATE POLICY "Merchants can view bookings for their items"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM merchant_profiles mp
      JOIN operator_associations oa ON oa.merchant_profile_id = mp.id
      WHERE mp.user_id = auth.uid()
      AND (
        bookings.operator = oa.operator_name
        OR bookings.item_id IN (
          SELECT id::text FROM events WHERE organizer = oa.operator_name
        )
      )
    )
  );

-- Phase 2: Create user_notifications table for persistent notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('success', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on user_notifications
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.user_notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.user_notifications FOR INSERT
  WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);

-- Add updated_at trigger
CREATE TRIGGER update_user_notifications_updated_at
  BEFORE UPDATE ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;

-- Phase 3: Add seat layout support to buses table
ALTER TABLE public.buses 
  ADD COLUMN IF NOT EXISTS seat_layout JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.buses.seat_layout IS 'Seat layout configuration: {format: "2-2"|"2-1"|"3-2"|"2-3", rows: number, customSeats: {row: number, positions: string[]}}';