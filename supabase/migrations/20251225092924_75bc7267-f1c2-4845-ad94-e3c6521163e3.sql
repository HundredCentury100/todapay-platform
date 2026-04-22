-- Phase 1: Favorite Properties
CREATE TABLE public.favorite_properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE public.favorite_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" ON public.favorite_properties
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites" ON public.favorite_properties
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites" ON public.favorite_properties
  FOR DELETE USING (auth.uid() = user_id);

-- Phase 6: Stay Special Requests
CREATE TABLE public.stay_special_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stay_booking_id UUID NOT NULL REFERENCES public.stay_bookings(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('early_checkin', 'late_checkout', 'extra_bed', 'crib', 'airport_transfer', 'other')),
  requested_time TIME,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  additional_charge NUMERIC DEFAULT 0,
  notes TEXT,
  response_notes TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stay_special_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.stay_special_requests
  FOR SELECT USING (
    stay_booking_id IN (
      SELECT sb.id FROM stay_bookings sb
      JOIN bookings b ON sb.booking_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create requests" ON public.stay_special_requests
  FOR INSERT WITH CHECK (
    stay_booking_id IN (
      SELECT sb.id FROM stay_bookings sb
      JOIN bookings b ON sb.booking_id = b.id
      WHERE b.user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can view property requests" ON public.stay_special_requests
  FOR SELECT USING (
    stay_booking_id IN (
      SELECT sb.id FROM stay_bookings sb
      JOIN properties p ON sb.property_id = p.id
      JOIN merchant_profiles mp ON p.merchant_profile_id = mp.id
      WHERE mp.user_id = auth.uid()
    )
  );

CREATE POLICY "Merchants can update requests" ON public.stay_special_requests
  FOR UPDATE USING (
    stay_booking_id IN (
      SELECT sb.id FROM stay_bookings sb
      JOIN properties p ON sb.property_id = p.id
      JOIN merchant_profiles mp ON p.merchant_profile_id = mp.id
      WHERE mp.user_id = auth.uid()
    )
  );

-- Phase 10: Property Price Alerts
CREATE TABLE public.property_price_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city TEXT NOT NULL,
  property_type TEXT,
  target_price NUMERIC NOT NULL,
  check_in_date DATE,
  check_out_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.property_price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own alerts" ON public.property_price_alerts
  FOR ALL USING (auth.uid() = user_id);

-- Phase 11: Seasonal Pricing Rules
CREATE TABLE public.seasonal_pricing_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  price_multiplier NUMERIC NOT NULL DEFAULT 1.0 CHECK (price_multiplier > 0),
  room_ids UUID[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seasonal_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rules" ON public.seasonal_pricing_rules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Merchants can manage own rules" ON public.seasonal_pricing_rules
  FOR ALL USING (
    property_id IN (
      SELECT id FROM properties WHERE merchant_profile_id IN (
        SELECT id FROM merchant_profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Phase 12: Stay Messages
CREATE TABLE public.stay_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stay_booking_id UUID NOT NULL REFERENCES public.stay_bookings(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('guest', 'merchant')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stay_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their bookings" ON public.stay_messages
  FOR SELECT USING (
    stay_booking_id IN (
      SELECT sb.id FROM stay_bookings sb
      JOIN bookings b ON sb.booking_id = b.id
      WHERE b.user_id = auth.uid()
    ) OR
    stay_booking_id IN (
      SELECT sb.id FROM stay_bookings sb
      JOIN properties p ON sb.property_id = p.id
      JOIN merchant_profiles mp ON p.merchant_profile_id = mp.id
      WHERE mp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages" ON public.stay_messages
  FOR INSERT WITH CHECK (
    (sender_type = 'guest' AND stay_booking_id IN (
      SELECT sb.id FROM stay_bookings sb
      JOIN bookings b ON sb.booking_id = b.id
      WHERE b.user_id = auth.uid()
    )) OR
    (sender_type = 'merchant' AND stay_booking_id IN (
      SELECT sb.id FROM stay_bookings sb
      JOIN properties p ON sb.property_id = p.id
      JOIN merchant_profiles mp ON p.merchant_profile_id = mp.id
      WHERE mp.user_id = auth.uid()
    ))
  );

CREATE POLICY "Recipients can mark as read" ON public.stay_messages
  FOR UPDATE USING (
    stay_booking_id IN (
      SELECT sb.id FROM stay_bookings sb
      JOIN bookings b ON sb.booking_id = b.id
      WHERE b.user_id = auth.uid()
    ) OR
    stay_booking_id IN (
      SELECT sb.id FROM stay_bookings sb
      JOIN properties p ON sb.property_id = p.id
      JOIN merchant_profiles mp ON p.merchant_profile_id = mp.id
      WHERE mp.user_id = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_stay_special_requests_updated_at
  BEFORE UPDATE ON public.stay_special_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_property_price_alerts_updated_at
  BEFORE UPDATE ON public.property_price_alerts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_seasonal_pricing_rules_updated_at
  BEFORE UPDATE ON public.seasonal_pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();