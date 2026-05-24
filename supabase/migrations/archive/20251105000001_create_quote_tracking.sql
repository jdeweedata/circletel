-- Create quote tracking table for monitoring quote views and interactions
CREATE TABLE IF NOT EXISTS public.quote_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES public.business_quotes(id) ON DELETE CASCADE,

  -- Tracking information
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'email_sent', 'shared', 'downloaded')),
  viewer_ip TEXT,
  viewer_user_agent TEXT,
  viewer_location JSONB, -- Can store country, city, etc.

  -- Referrer information
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- User identification (if available)
  viewer_email TEXT,
  viewer_name TEXT,
  admin_user_id UUID REFERENCES public.admin_users(id) ON DELETE SET NULL,

  -- Session tracking
  session_id TEXT,
  time_spent_seconds INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quote_tracking_quote_id ON public.quote_tracking(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_tracking_event_type ON public.quote_tracking(event_type);
CREATE INDEX IF NOT EXISTS idx_quote_tracking_created_at ON public.quote_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_tracking_session_id ON public.quote_tracking(session_id);

-- Create a view for quote analytics
CREATE OR REPLACE VIEW public.quote_analytics AS
SELECT
  q.id AS quote_id,
  q.quote_number,
  q.company_name,
  q.contact_email,
  q.status,
  COUNT(DISTINCT qt.id) FILTER (WHERE qt.event_type = 'view') AS total_views,
  COUNT(DISTINCT qt.session_id) FILTER (WHERE qt.event_type = 'view') AS unique_views,
  COUNT(DISTINCT qt.id) FILTER (WHERE qt.event_type = 'email_sent') AS emails_sent,
  COUNT(DISTINCT qt.id) FILTER (WHERE qt.event_type = 'shared') AS shares,
  COUNT(DISTINCT qt.id) FILTER (WHERE qt.event_type = 'downloaded') AS downloads,
  MAX(qt.created_at) FILTER (WHERE qt.event_type = 'view') AS last_viewed_at,
  COALESCE(SUM(qt.time_spent_seconds) FILTER (WHERE qt.event_type = 'view'), 0) AS total_time_spent_seconds,
  q.created_at AS quote_created_at
FROM public.business_quotes q
LEFT JOIN public.quote_tracking qt ON q.id = qt.quote_id
GROUP BY q.id, q.quote_number, q.company_name, q.contact_email, q.status, q.created_at;

-- Enable Row Level Security
ALTER TABLE public.quote_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Allow anyone to insert tracking events (for public quote views)
CREATE POLICY "Allow public to track quote views"
  ON public.quote_tracking
  FOR INSERT
  WITH CHECK (true);

-- Allow admins to view all tracking data
CREATE POLICY "Allow admins to view all tracking data"
  ON public.quote_tracking
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Grant necessary permissions
GRANT SELECT ON public.quote_analytics TO authenticated;
GRANT INSERT ON public.quote_tracking TO anon, authenticated;
GRANT SELECT ON public.quote_tracking TO authenticated;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_quote_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_quote_tracking_updated_at
  BEFORE UPDATE ON public.quote_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_quote_tracking_updated_at();

-- Add share_token column to business_quotes table for shareable links
ALTER TABLE public.business_quotes
ADD COLUMN IF NOT EXISTS share_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS share_expires_at TIMESTAMPTZ;

-- Create index on share_token for fast lookups
CREATE INDEX IF NOT EXISTS idx_business_quotes_share_token ON public.business_quotes(share_token) WHERE share_token IS NOT NULL;

-- Function to generate a unique share token
CREATE OR REPLACE FUNCTION public.generate_quote_share_token(quote_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
  token_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 32-character token
    token := encode(gen_random_bytes(24), 'base64');
    -- Remove special characters and make URL-safe
    token := replace(replace(replace(token, '/', ''), '+', ''), '=', '');

    -- Check if token already exists
    SELECT EXISTS(
      SELECT 1 FROM public.business_quotes WHERE share_token = token
    ) INTO token_exists;

    -- Exit loop if token is unique
    EXIT WHEN NOT token_exists;
  END LOOP;

  -- Update the quote with the new token
  UPDATE public.business_quotes
  SET share_token = token,
      share_enabled = true,
      updated_at = NOW()
  WHERE id = quote_uuid;

  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.generate_quote_share_token(UUID) TO authenticated;
