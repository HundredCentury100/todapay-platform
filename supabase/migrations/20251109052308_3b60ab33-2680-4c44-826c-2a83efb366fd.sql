-- Add family pricing and viewing sections to ticket tiers
ALTER TABLE event_ticket_tiers 
ADD COLUMN IF NOT EXISTS viewing_section text,
ADD COLUMN IF NOT EXISTS section_details jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS family_pricing jsonb DEFAULT '{}'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN event_ticket_tiers.viewing_section IS 'Specific viewing location (e.g., Behind Goal, Sideline, Behind Posts)';
COMMENT ON COLUMN event_ticket_tiers.section_details IS 'Additional section info like row range, amenities';
COMMENT ON COLUMN event_ticket_tiers.family_pricing IS 'Family ticket pricing rules: {adult_price, child_price, family_bundle, max_children}';

-- Update event_addons to support more types
ALTER TABLE event_addons 
ADD COLUMN IF NOT EXISTS requires_details boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN event_addons.requires_details IS 'Whether this addon needs additional user input (e.g., parking - vehicle registration)';
COMMENT ON COLUMN event_addons.metadata IS 'Additional addon info like validity period, restrictions, included items';