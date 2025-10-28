-- =====================================================
-- Migration: Create Order Tracking System
-- Purpose: Track detailed order fulfillment stages for customer visibility
-- Date: 2025-10-28
-- =====================================================

-- Add tracking columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS order_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS delivery_tracking_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS delivery_carrier VARCHAR(100),
ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS site_survey_scheduled_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS site_survey_completed_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS site_survey_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS site_survey_notes TEXT,
ADD COLUMN IF NOT EXISTS installation_scheduled_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS installation_completed_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS installation_technician VARCHAR(255),
ADD COLUMN IF NOT EXISTS installation_notes TEXT,
ADD COLUMN IF NOT EXISTS activation_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS billing_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expected_completion_date TIMESTAMPTZ;

-- Update existing rows to have valid default values
UPDATE public.orders
SET
  order_type = 'fiber',
  fulfillment_status = 'order_confirmed'
WHERE order_type IS NULL OR fulfillment_status IS NULL;

-- Set defaults for new rows
ALTER TABLE public.orders
ALTER COLUMN order_type SET DEFAULT 'fiber',
ALTER COLUMN fulfillment_status SET DEFAULT 'order_confirmed';

-- Add constraints for new columns
ALTER TABLE public.orders
DROP CONSTRAINT IF EXISTS valid_order_type,
DROP CONSTRAINT IF EXISTS valid_fulfillment_status,
DROP CONSTRAINT IF EXISTS valid_delivery_status,
DROP CONSTRAINT IF EXISTS valid_site_survey_status;

ALTER TABLE public.orders
ADD CONSTRAINT valid_order_type CHECK (
  order_type IN ('fiber', 'wireless', 'lte', '5g')
),
ADD CONSTRAINT valid_fulfillment_status CHECK (
  fulfillment_status IN (
    'order_confirmed',
    'equipment_prepared',
    'shipped',
    'out_for_delivery',
    'delivered',
    'site_survey_scheduled',
    'site_survey_completed',
    'installation_scheduled',
    'installation_in_progress',
    'installation_completed',
    'activation_scheduled',
    'service_activated',
    'completed',
    'cancelled'
  )
),
ADD CONSTRAINT valid_delivery_status CHECK (
  delivery_status IS NULL OR delivery_status IN (
    'pending',
    'prepared',
    'shipped',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'failed',
    'returned'
  )
),
ADD CONSTRAINT valid_site_survey_status CHECK (
  site_survey_status IS NULL OR site_survey_status IN (
    'scheduled',
    'in_progress',
    'passed',
    'failed',
    'rescheduled'
  )
);

-- Create order_tracking_events table for detailed timeline
CREATE TABLE IF NOT EXISTS public.order_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,

  -- Event Details
  event_type VARCHAR(100) NOT NULL,
  event_status VARCHAR(50) NOT NULL,
  event_title VARCHAR(255) NOT NULL,
  event_description TEXT,

  -- Event Data
  event_data JSONB,

  -- Scheduling (for future events)
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Visibility
  visible_to_customer BOOLEAN DEFAULT TRUE,

  CONSTRAINT valid_event_type CHECK (
    event_type IN (
      'order_confirmed',
      'payment_received',
      'equipment_prepared',
      'equipment_shipped',
      'delivery_out',
      'delivery_completed',
      'delivery_failed',
      'site_survey_scheduled',
      'site_survey_completed',
      'site_survey_failed',
      'installation_scheduled',
      'installation_started',
      'installation_completed',
      'installation_failed',
      'activation_scheduled',
      'service_activated',
      'order_completed',
      'order_cancelled',
      'status_update',
      'note_added'
    )
  ),
  CONSTRAINT valid_event_status CHECK (
    event_status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled')
  )
);

-- Create indexes for performance
CREATE INDEX idx_order_tracking_events_order_id ON public.order_tracking_events(order_id);
CREATE INDEX idx_order_tracking_events_event_type ON public.order_tracking_events(event_type);
CREATE INDEX idx_order_tracking_events_created_at ON public.order_tracking_events(created_at DESC);
CREATE INDEX idx_order_tracking_events_scheduled_date ON public.order_tracking_events(scheduled_date);
CREATE INDEX idx_order_tracking_events_visible_to_customer ON public.order_tracking_events(visible_to_customer);

-- Create updated_at trigger for events
CREATE OR REPLACE FUNCTION update_order_tracking_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_tracking_events_timestamp
  BEFORE UPDATE ON public.order_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION update_order_tracking_events_updated_at();

-- Enable Row Level Security
ALTER TABLE public.order_tracking_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for order_tracking_events

-- Policy: Service role has full access
CREATE POLICY "Service role has full access to order tracking events"
  ON public.order_tracking_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Customers can read their own order events
CREATE POLICY "Customers can read their own order tracking events"
  ON public.order_tracking_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_tracking_events.order_id
      AND orders.customer_email = auth.jwt() ->> 'email'
      AND order_tracking_events.visible_to_customer = true
    )
  );

-- Create order notification preferences table
CREATE TABLE IF NOT EXISTS public.order_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email VARCHAR(255) NOT NULL UNIQUE,

  -- Notification Channels
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT TRUE,

  -- Notification Types
  notify_order_confirmed BOOLEAN DEFAULT TRUE,
  notify_shipped BOOLEAN DEFAULT TRUE,
  notify_delivered BOOLEAN DEFAULT TRUE,
  notify_survey_scheduled BOOLEAN DEFAULT TRUE,
  notify_installation_scheduled BOOLEAN DEFAULT TRUE,
  notify_service_activated BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on customer email
CREATE INDEX idx_order_notification_preferences_email ON public.order_notification_preferences(customer_email);

-- Enable RLS
ALTER TABLE public.order_notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification preferences
CREATE POLICY "Service role has full access to notification preferences"
  ON public.order_notification_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Customers can manage their own notification preferences"
  ON public.order_notification_preferences
  FOR ALL
  TO authenticated
  USING (customer_email = auth.jwt() ->> 'email')
  WITH CHECK (customer_email = auth.jwt() ->> 'email');

-- Create updated_at trigger for notification preferences
CREATE TRIGGER update_order_notification_preferences_timestamp
  BEFORE UPDATE ON public.order_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_order_tracking_events_updated_at();

-- Add comments for documentation
COMMENT ON COLUMN public.orders.order_type IS 'Type of order: fiber, wireless, lte, 5g';
COMMENT ON COLUMN public.orders.fulfillment_status IS 'Current stage of order fulfillment';
COMMENT ON COLUMN public.orders.delivery_tracking_number IS 'Courier tracking number for equipment delivery';
COMMENT ON COLUMN public.orders.site_survey_scheduled_date IS 'Scheduled date/time for site survey';
COMMENT ON COLUMN public.orders.installation_scheduled_date IS 'Scheduled date/time for installation';
COMMENT ON COLUMN public.orders.activation_date IS 'Date service was activated';
COMMENT ON COLUMN public.orders.billing_start_date IS 'Date billing cycle starts';

COMMENT ON TABLE public.order_tracking_events IS 'Detailed timeline of order fulfillment events';
COMMENT ON COLUMN public.order_tracking_events.event_type IS 'Type of event that occurred';
COMMENT ON COLUMN public.order_tracking_events.event_data IS 'Additional event data (JSON): tracking numbers, technician info, etc.';
COMMENT ON COLUMN public.order_tracking_events.visible_to_customer IS 'Whether this event should be shown to customer';

COMMENT ON TABLE public.order_notification_preferences IS 'Customer preferences for order status notifications';

-- Grant permissions
GRANT SELECT, UPDATE ON public.orders TO authenticated;
GRANT SELECT ON public.order_tracking_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.order_notification_preferences TO authenticated;

GRANT ALL ON public.order_tracking_events TO service_role;
GRANT ALL ON public.order_notification_preferences TO service_role;

-- Create helper function to add tracking event
CREATE OR REPLACE FUNCTION add_order_tracking_event(
  p_order_id UUID,
  p_event_type VARCHAR,
  p_event_status VARCHAR,
  p_event_title VARCHAR,
  p_event_description TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT NULL,
  p_scheduled_date TIMESTAMPTZ DEFAULT NULL,
  p_visible_to_customer BOOLEAN DEFAULT TRUE
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.order_tracking_events (
    order_id,
    event_type,
    event_status,
    event_title,
    event_description,
    event_data,
    scheduled_date,
    visible_to_customer
  ) VALUES (
    p_order_id,
    p_event_type,
    p_event_status,
    p_event_title,
    p_event_description,
    p_event_data,
    p_scheduled_date,
    p_visible_to_customer
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to update order fulfillment status
CREATE OR REPLACE FUNCTION update_order_fulfillment_status(
  p_order_id UUID,
  p_fulfillment_status VARCHAR,
  p_event_title VARCHAR,
  p_event_description TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update order status
  UPDATE public.orders
  SET
    fulfillment_status = p_fulfillment_status,
    updated_at = now()
  WHERE id = p_order_id;

  -- Add tracking event
  PERFORM add_order_tracking_event(
    p_order_id,
    p_fulfillment_status,
    'completed',
    p_event_title,
    p_event_description,
    NULL,
    NULL,
    TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION add_order_tracking_event TO service_role;
GRANT EXECUTE ON FUNCTION update_order_fulfillment_status TO service_role;
