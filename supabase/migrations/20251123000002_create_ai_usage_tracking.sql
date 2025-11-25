-- AI Usage Tracking Migration
-- Tracks AI API usage, rate limiting, and cost estimation for CMS

-- Create ai_usage_logs table
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Request details
  request_type TEXT NOT NULL CHECK (request_type IN ('content_generation', 'seo_optimization', 'image_generation', 'content_rewrite')),
  model_used TEXT NOT NULL, -- e.g., 'gemini-pro', 'gemini-1.5-flash'

  -- Token usage
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,

  -- Cost tracking (in USD cents)
  estimated_cost_cents INTEGER DEFAULT 0,

  -- Metadata
  page_id UUID REFERENCES public.cms_pages(id) ON DELETE SET NULL,
  content_type TEXT, -- e.g., 'blog', 'landing_page', 'product_page'
  prompt_length INTEGER,
  response_time_ms INTEGER,

  -- Status
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes for common queries
  CONSTRAINT valid_tokens CHECK (input_tokens >= 0 AND output_tokens >= 0),
  CONSTRAINT valid_cost CHECK (estimated_cost_cents >= 0)
);

-- Create indexes for performance
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at DESC);
CREATE INDEX idx_ai_usage_logs_request_type ON public.ai_usage_logs(request_type);
CREATE INDEX idx_ai_usage_logs_page_id ON public.ai_usage_logs(page_id);

-- Create composite index for user usage queries
CREATE INDEX idx_ai_usage_logs_user_date ON public.ai_usage_logs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own usage logs
CREATE POLICY "Users can view own AI usage logs"
  ON public.ai_usage_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can insert usage logs (API routes)
CREATE POLICY "Service role can insert AI usage logs"
  ON public.ai_usage_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admins can view all usage logs
CREATE POLICY "Admins can view all AI usage logs"
  ON public.ai_usage_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id::text = auth.uid()::text
      AND admin_users.is_active = true
    )
  );

-- Create function to get user's daily usage
CREATE OR REPLACE FUNCTION public.get_user_daily_ai_usage(
  target_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  request_count BIGINT,
  total_tokens BIGINT,
  total_cost_cents BIGINT,
  last_request TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    COUNT(*)::BIGINT as request_count,
    COALESCE(SUM(input_tokens + output_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(estimated_cost_cents), 0)::BIGINT as total_cost_cents,
    MAX(created_at) as last_request
  FROM public.ai_usage_logs
  WHERE user_id = target_user_id
    AND created_at >= CURRENT_DATE
    AND success = true;
$$;

-- Create function to get user's monthly usage
CREATE OR REPLACE FUNCTION public.get_user_monthly_ai_usage(
  target_user_id UUID DEFAULT auth.uid()
)
RETURNS TABLE (
  request_count BIGINT,
  total_tokens BIGINT,
  total_cost_cents BIGINT,
  avg_response_time_ms NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    COUNT(*)::BIGINT as request_count,
    COALESCE(SUM(input_tokens + output_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(estimated_cost_cents), 0)::BIGINT as total_cost_cents,
    COALESCE(AVG(response_time_ms), 0)::NUMERIC as avg_response_time_ms
  FROM public.ai_usage_logs
  WHERE user_id = target_user_id
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
    AND success = true;
$$;

-- Create function to get usage statistics by request type
CREATE OR REPLACE FUNCTION public.get_ai_usage_by_type(
  target_user_id UUID DEFAULT auth.uid(),
  start_date TIMESTAMPTZ DEFAULT DATE_TRUNC('month', CURRENT_DATE),
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  request_type TEXT,
  request_count BIGINT,
  total_tokens BIGINT,
  total_cost_cents BIGINT,
  success_rate NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    request_type,
    COUNT(*)::BIGINT as request_count,
    COALESCE(SUM(input_tokens + output_tokens), 0)::BIGINT as total_tokens,
    COALESCE(SUM(estimated_cost_cents), 0)::BIGINT as total_cost_cents,
    ROUND(
      (COUNT(*) FILTER (WHERE success = true)::NUMERIC / COUNT(*)::NUMERIC) * 100,
      2
    ) as success_rate
  FROM public.ai_usage_logs
  WHERE user_id = target_user_id
    AND created_at BETWEEN start_date AND end_date
  GROUP BY request_type
  ORDER BY request_count DESC;
$$;

-- Create function to check if user has exceeded rate limits
CREATE OR REPLACE FUNCTION public.check_ai_rate_limit(
  target_user_id UUID DEFAULT auth.uid(),
  daily_limit INTEGER DEFAULT 100,
  hourly_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  within_limits BOOLEAN,
  daily_count BIGINT,
  hourly_count BIGINT,
  daily_remaining INTEGER,
  hourly_remaining INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  WITH daily_usage AS (
    SELECT COUNT(*) as count
    FROM public.ai_usage_logs
    WHERE user_id = target_user_id
      AND created_at >= CURRENT_DATE
      AND success = true
  ),
  hourly_usage AS (
    SELECT COUNT(*) as count
    FROM public.ai_usage_logs
    WHERE user_id = target_user_id
      AND created_at >= NOW() - INTERVAL '1 hour'
      AND success = true
  )
  SELECT
    (daily_usage.count < daily_limit AND hourly_usage.count < hourly_limit) as within_limits,
    daily_usage.count::BIGINT as daily_count,
    hourly_usage.count::BIGINT as hourly_count,
    GREATEST(0, daily_limit - daily_usage.count::INTEGER) as daily_remaining,
    GREATEST(0, hourly_limit - hourly_usage.count::INTEGER) as hourly_remaining
  FROM daily_usage, hourly_usage;
$$;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.get_user_daily_ai_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_monthly_ai_usage TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_ai_usage_by_type TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_ai_rate_limit TO authenticated;

-- Add comment
COMMENT ON TABLE public.ai_usage_logs IS 'Tracks AI API usage for CMS content generation with rate limiting and cost estimation';
COMMENT ON FUNCTION public.check_ai_rate_limit IS 'Checks if user has exceeded AI generation rate limits (default: 100/day, 20/hour)';
