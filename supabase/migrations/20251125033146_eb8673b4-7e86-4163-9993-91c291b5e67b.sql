-- Add extended contact details to merchant_profiles table
ALTER TABLE merchant_profiles 
ADD COLUMN IF NOT EXISTS support_email text,
ADD COLUMN IF NOT EXISTS support_phone text,
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS customer_agent_name text,
ADD COLUMN IF NOT EXISTS customer_agent_email text,
ADD COLUMN IF NOT EXISTS customer_agent_phone text,
ADD COLUMN IF NOT EXISTS whatsapp_number text,
ADD COLUMN IF NOT EXISTS social_media_links jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN merchant_profiles.support_email IS 'Dedicated support email for customer inquiries';
COMMENT ON COLUMN merchant_profiles.support_phone IS 'Dedicated support phone number';
COMMENT ON COLUMN merchant_profiles.website_url IS 'Official website URL';
COMMENT ON COLUMN merchant_profiles.customer_agent_name IS 'Name of primary customer service agent';
COMMENT ON COLUMN merchant_profiles.customer_agent_email IS 'Customer service agent email';
COMMENT ON COLUMN merchant_profiles.customer_agent_phone IS 'Customer service agent phone';
COMMENT ON COLUMN merchant_profiles.whatsapp_number IS 'WhatsApp business number';
COMMENT ON COLUMN merchant_profiles.social_media_links IS 'JSON object with social media URLs (facebook, twitter, instagram, linkedin)';