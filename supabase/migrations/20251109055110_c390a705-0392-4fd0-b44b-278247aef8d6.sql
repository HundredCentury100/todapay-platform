-- Add organizer code to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS organizer_code TEXT DEFAULT 'EVNT';

-- Add transfer tracking columns to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transfer_count INTEGER DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS original_booking_id UUID REFERENCES bookings(id);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transferred_from_email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transferred_to_email TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS transfer_date TIMESTAMP WITH TIME ZONE;

-- Create ticket shares table for shareable links
CREATE TABLE IF NOT EXISTS ticket_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  share_type TEXT NOT NULL CHECK (share_type IN ('view', 'transfer')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accessed_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ticket_shares
ALTER TABLE ticket_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view ticket shares with valid token
CREATE POLICY "Anyone can view ticket shares with token"
  ON ticket_shares
  FOR SELECT
  USING (expires_at > NOW());

-- Policy: Users can create ticket shares for their bookings
CREATE POLICY "Users can create ticket shares for own bookings"
  ON ticket_shares
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = ticket_shares.booking_id
      AND (bookings.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

-- Policy: System can update share access counts
CREATE POLICY "System can update ticket shares"
  ON ticket_shares
  FOR UPDATE
  USING (true);

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_ticket_shares_token ON ticket_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_ticket_shares_booking ON ticket_shares(booking_id);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_ticket_shares_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ticket_shares_updated_at
  BEFORE UPDATE ON ticket_shares
  FOR EACH ROW
  EXECUTE FUNCTION update_ticket_shares_updated_at();