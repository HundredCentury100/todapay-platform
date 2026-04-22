-- Phase 1: Workspace Vertical Enhancement

-- 1.1 Add multi-dimensional rating columns to workspace_reviews
ALTER TABLE public.workspace_reviews 
ADD COLUMN IF NOT EXISTS space_rating INTEGER CHECK (space_rating >= 1 AND space_rating <= 5),
ADD COLUMN IF NOT EXISTS service_rating INTEGER CHECK (service_rating >= 1 AND service_rating <= 5),
ADD COLUMN IF NOT EXISTS value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
ADD COLUMN IF NOT EXISTS merchant_response TEXT,
ADD COLUMN IF NOT EXISTS responded_at TIMESTAMPTZ;

-- 1.2 Create workspace_blocked_dates table
CREATE TABLE IF NOT EXISTS public.workspace_blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  reason TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  recurrence_day_of_week INTEGER CHECK (recurrence_day_of_week >= 0 AND recurrence_day_of_week <= 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_datetime_range CHECK (end_datetime > start_datetime)
);

-- Enable RLS on workspace_blocked_dates
ALTER TABLE public.workspace_blocked_dates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspace_blocked_dates
-- Public SELECT for availability checks
CREATE POLICY "Anyone can view workspace blocked dates"
ON public.workspace_blocked_dates
FOR SELECT
USING (true);

-- INSERT for workspace owners only
CREATE POLICY "Workspace owners can create blocked dates"
ON public.workspace_blocked_dates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    JOIN public.merchant_profiles mp ON w.merchant_profile_id = mp.id
    WHERE w.id = workspace_id
    AND mp.user_id = auth.uid()
  )
);

-- UPDATE for workspace owners only
CREATE POLICY "Workspace owners can update blocked dates"
ON public.workspace_blocked_dates
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    JOIN public.merchant_profiles mp ON w.merchant_profile_id = mp.id
    WHERE w.id = workspace_id
    AND mp.user_id = auth.uid()
  )
);

-- DELETE for workspace owners only
CREATE POLICY "Workspace owners can delete blocked dates"
ON public.workspace_blocked_dates
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    JOIN public.merchant_profiles mp ON w.merchant_profile_id = mp.id
    WHERE w.id = workspace_id
    AND mp.user_id = auth.uid()
  )
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_workspace_blocked_dates_workspace_id 
ON public.workspace_blocked_dates(workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_blocked_dates_datetime 
ON public.workspace_blocked_dates(start_datetime, end_datetime);

-- 1.3 Create respond_to_workspace_review RPC function
CREATE OR REPLACE FUNCTION public.respond_to_workspace_review(p_review_id UUID, p_response TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_workspace_id UUID;
  v_merchant_id UUID;
BEGIN
  -- Get the workspace_id from the review
  SELECT workspace_id INTO v_workspace_id 
  FROM workspace_reviews 
  WHERE id = p_review_id;
  
  IF v_workspace_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if the current user owns this workspace
  SELECT merchant_profile_id INTO v_merchant_id
  FROM workspaces
  WHERE id = v_workspace_id;
  
  -- Verify the merchant owns this workspace
  IF NOT EXISTS (
    SELECT 1 FROM merchant_profiles 
    WHERE id = v_merchant_id 
    AND user_id = auth.uid()
  ) THEN
    RETURN FALSE;
  END IF;
  
  -- Update the review with merchant response
  UPDATE workspace_reviews
  SET 
    merchant_response = p_response,
    responded_at = now(),
    updated_at = now()
  WHERE id = p_review_id;
  
  RETURN TRUE;
END;
$$;