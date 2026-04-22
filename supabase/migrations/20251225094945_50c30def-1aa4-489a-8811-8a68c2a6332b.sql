-- Create favorite_workspaces table for wishlist functionality
CREATE TABLE IF NOT EXISTS public.favorite_workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Enable RLS
ALTER TABLE public.favorite_workspaces ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorite_workspaces
CREATE POLICY "Users can view their own favorites"
  ON public.favorite_workspaces FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorite_workspaces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON public.favorite_workspaces FOR DELETE
  USING (auth.uid() = user_id);

-- Create workspace_reviews table
CREATE TABLE IF NOT EXISTS public.workspace_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, workspace_id)
);

-- Enable RLS
ALTER TABLE public.workspace_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_reviews
CREATE POLICY "Anyone can view workspace reviews"
  ON public.workspace_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own reviews"
  ON public.workspace_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
  ON public.workspace_reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON public.workspace_reviews FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at on workspace_reviews
CREATE TRIGGER update_workspace_reviews_updated_at
  BEFORE UPDATE ON public.workspace_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();