-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Email notifications
  email_booking_confirmation BOOLEAN DEFAULT true,
  email_booking_reminder BOOLEAN DEFAULT true,
  email_reschedule_status BOOLEAN DEFAULT true,
  email_refund_status BOOLEAN DEFAULT true,
  email_upgrade_status BOOLEAN DEFAULT true,
  email_trip_updates BOOLEAN DEFAULT true,
  email_promotions BOOLEAN DEFAULT false,
  
  -- In-app notifications
  app_booking_confirmation BOOLEAN DEFAULT true,
  app_booking_reminder BOOLEAN DEFAULT true,
  app_reschedule_status BOOLEAN DEFAULT true,
  app_refund_status BOOLEAN DEFAULT true,
  app_upgrade_status BOOLEAN DEFAULT true,
  app_trip_updates BOOLEAN DEFAULT true,
  app_promotions BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better performance
CREATE INDEX idx_notification_preferences_user ON public.notification_preferences(user_id);