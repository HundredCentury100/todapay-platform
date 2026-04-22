
-- Trip Carts table
CREATE TABLE public.trip_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'checked_out', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trip Cart Items table
CREATE TABLE public.trip_cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID REFERENCES public.trip_carts(id) ON DELETE CASCADE NOT NULL,
  vertical TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_trip_carts_user_id ON public.trip_carts(user_id);
CREATE INDEX idx_trip_carts_status ON public.trip_carts(status);
CREATE INDEX idx_trip_cart_items_cart_id ON public.trip_cart_items(cart_id);
CREATE INDEX idx_trip_cart_items_vertical ON public.trip_cart_items(vertical);

-- RLS
ALTER TABLE public.trip_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_cart_items ENABLE ROW LEVEL SECURITY;

-- Trip carts: users can only access their own
CREATE POLICY "Users can view own carts" ON public.trip_carts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own carts" ON public.trip_carts
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own carts" ON public.trip_carts
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own carts" ON public.trip_carts
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Trip cart items: users can access items in their own carts
CREATE POLICY "Users can view own cart items" ON public.trip_cart_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.trip_carts WHERE id = cart_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own cart items" ON public.trip_cart_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.trip_carts WHERE id = cart_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own cart items" ON public.trip_cart_items
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.trip_carts WHERE id = cart_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own cart items" ON public.trip_cart_items
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.trip_carts WHERE id = cart_id AND user_id = auth.uid())
  );

-- Updated_at trigger
CREATE TRIGGER update_trip_carts_updated_at
  BEFORE UPDATE ON public.trip_carts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_cart_items_updated_at
  BEFORE UPDATE ON public.trip_cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
