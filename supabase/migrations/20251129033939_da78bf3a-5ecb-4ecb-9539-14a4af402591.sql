-- Add columns for recurring and seasonal events support
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence_pattern TEXT; -- 'daily', 'weekly', 'monthly', 'yearly'
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence_days INTEGER[]; -- Days of week [0-6] for weekly patterns
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS recurrence_end_date DATE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS season_name TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS series_id UUID;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS parent_event_id UUID REFERENCES public.events(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_instance_number INTEGER DEFAULT 1;

-- Add index for efficient querying of recurring events
CREATE INDEX IF NOT EXISTS idx_events_series_id ON public.events(series_id);
CREATE INDEX IF NOT EXISTS idx_events_parent_event_id ON public.events(parent_event_id);
CREATE INDEX IF NOT EXISTS idx_events_season_name ON public.events(season_name);