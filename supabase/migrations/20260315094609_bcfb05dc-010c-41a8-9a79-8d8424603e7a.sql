
-- Add new float notification types to the check constraint
ALTER TABLE public.agent_notifications DROP CONSTRAINT agent_notifications_notification_type_check;

ALTER TABLE public.agent_notifications ADD CONSTRAINT agent_notifications_notification_type_check 
CHECK (notification_type = ANY (ARRAY[
  'new_booking', 'payout_approved', 'payout_rejected', 'commission_approved', 
  'tier_upgraded', 'client_message', 'float_loaded', 'low_float_balance', 'float_deducted'
]));
