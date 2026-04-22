-- Add ride enhancements columns to ride_requests
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS waypoints JSONB;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS preferences JSONB;
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS recipient_name VARCHAR(100);
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS recipient_phone VARCHAR(20);
ALTER TABLE ride_requests ADD COLUMN IF NOT EXISTS promo_code_id UUID;

-- Add pickup_pin to active_rides
ALTER TABLE active_rides ADD COLUMN IF NOT EXISTS pickup_pin VARCHAR(4);

-- Create driver achievements table
CREATE TABLE IF NOT EXISTS driver_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  achievement_type VARCHAR(50) NOT NULL,
  achievement_name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create driver streaks table
CREATE TABLE IF NOT EXISTS driver_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  streak_type VARCHAR(20) NOT NULL CHECK (streak_type IN ('daily', 'weekly', 'monthly')),
  current_count INTEGER DEFAULT 0,
  target_count INTEGER NOT NULL,
  bonus_credits DECIMAL(10,2) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE driver_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies for driver_achievements
CREATE POLICY "Drivers can view their own achievements" 
ON driver_achievements FOR SELECT 
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "System can insert achievements" 
ON driver_achievements FOR INSERT 
WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- RLS policies for driver_streaks
CREATE POLICY "Drivers can view their own streaks" 
ON driver_streaks FOR SELECT 
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can update their own streaks" 
ON driver_streaks FOR UPDATE 
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "System can insert streaks" 
ON driver_streaks FOR INSERT 
WITH CHECK (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- Add foreign key for promo_code_id (references existing promo_codes table)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'promo_codes') THEN
    ALTER TABLE ride_requests 
    ADD CONSTRAINT ride_requests_promo_code_id_fkey 
    FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_driver_achievements_driver ON driver_achievements(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_streaks_driver ON driver_streaks(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_streaks_active ON driver_streaks(driver_id, expires_at) WHERE completed_at IS NULL;