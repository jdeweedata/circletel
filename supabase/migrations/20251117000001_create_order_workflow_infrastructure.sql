-- Migration: Create Order Workflow Infrastructure
-- Description: Add technicians, installation tasks, and order communications tables
-- Date: 2025-11-17
-- Phase: 1 - Core Infrastructure

-- ============================================================================
-- 1. TECHNICIANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Information
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,

  -- Status
  is_active BOOLEAN DEFAULT true NOT NULL,

  -- Specialties (array of service types: fiber, wireless, lte, etc.)
  specialties TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Availability
  working_hours JSONB DEFAULT '{"monday": {"start": "08:00", "end": "17:00"}, "tuesday": {"start": "08:00", "end": "17:00"}, "wednesday": {"start": "08:00", "end": "17:00"}, "thursday": {"start": "08:00", "end": "17:00"}, "friday": {"start": "08:00", "end": "17:00"}, "saturday": {"start": "08:00", "end": "13:00"}, "sunday": null}'::JSONB,

  -- Statistics
  total_installations INTEGER DEFAULT 0,
  completed_installations INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for technicians
CREATE INDEX idx_technicians_active ON public.technicians(is_active) WHERE is_active = true;
CREATE INDEX idx_technicians_email ON public.technicians(email);

-- RLS Policies for technicians
ALTER TABLE public.technicians ENABLE ROW LEVEL SECURITY;

-- Admin users can manage technicians
CREATE POLICY "Admin users can view all technicians"
  ON public.technicians
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users can insert technicians"
  ON public.technicians
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users can update technicians"
  ON public.technicians
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_technicians_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_technicians_updated_at
  BEFORE UPDATE ON public.technicians
  FOR EACH ROW
  EXECUTE FUNCTION public.update_technicians_updated_at();

-- ============================================================================
-- 2. INSTALLATION TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.installation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  order_id UUID NOT NULL REFERENCES public.consumer_orders(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES public.technicians(id) ON DELETE SET NULL,

  -- Scheduling
  scheduled_date DATE NOT NULL,
  scheduled_time_slot TEXT, -- 'morning' (8-12), 'afternoon' (12-17), or specific time '09:00'
  estimated_duration_minutes INTEGER DEFAULT 120,

  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'failed')),

  -- Progress Tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  actual_duration_minutes INTEGER,

  -- Installation Details
  installation_address JSONB, -- Copy of order address for reference
  customer_contact_name TEXT,
  customer_contact_phone TEXT,
  customer_contact_email TEXT,

  -- Equipment Tracking
  equipment_installed JSONB DEFAULT '[]'::JSONB, -- Array of {type, model, serial_number, mac_address}
  router_model TEXT,
  router_serial TEXT,
  router_mac_address TEXT,

  -- Completion Details
  completion_photos TEXT[], -- Array of Supabase Storage URLs
  technician_notes TEXT,
  customer_signature_url TEXT, -- URL to signed completion document

  -- Issues and Resolution
  issues_encountered TEXT,
  resolution_notes TEXT,

  -- Customer Feedback
  customer_rating INTEGER CHECK (customer_rating BETWEEN 1 AND 5),
  customer_feedback TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Indexes for installation_tasks
CREATE INDEX idx_installation_tasks_order ON public.installation_tasks(order_id);
CREATE INDEX idx_installation_tasks_technician ON public.installation_tasks(technician_id);
CREATE INDEX idx_installation_tasks_scheduled_date ON public.installation_tasks(scheduled_date);
CREATE INDEX idx_installation_tasks_status ON public.installation_tasks(status);
CREATE INDEX idx_installation_tasks_technician_scheduled ON public.installation_tasks(technician_id, scheduled_date) WHERE status IN ('scheduled', 'in_progress');

-- RLS Policies for installation_tasks
ALTER TABLE public.installation_tasks ENABLE ROW LEVEL SECURITY;

-- Admin users can manage all installation tasks
CREATE POLICY "Admin users can view all installation tasks"
  ON public.installation_tasks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users can insert installation tasks"
  ON public.installation_tasks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users can update installation tasks"
  ON public.installation_tasks
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Technicians can view and update their own tasks
CREATE POLICY "Technicians can view their own tasks"
  ON public.installation_tasks
  FOR SELECT
  USING (
    technician_id IN (
      SELECT id FROM public.technicians
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Technicians can update their own tasks"
  ON public.installation_tasks
  FOR UPDATE
  USING (
    technician_id IN (
      SELECT id FROM public.technicians
      WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Trigger to update updated_at and track statistics
CREATE OR REPLACE FUNCTION public.update_installation_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();

  -- Update technician statistics when task is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.technicians
    SET completed_installations = completed_installations + 1
    WHERE id = NEW.technician_id;

    -- Calculate actual duration if not set
    IF NEW.actual_duration_minutes IS NULL AND NEW.started_at IS NOT NULL THEN
      NEW.actual_duration_minutes = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_installation_tasks_updated_at
  BEFORE UPDATE ON public.installation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_installation_tasks_updated_at();

-- ============================================================================
-- 3. ORDER COMMUNICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.order_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  order_id UUID NOT NULL REFERENCES public.consumer_orders(id) ON DELETE CASCADE,
  order_type TEXT DEFAULT 'consumer' CHECK (order_type IN ('consumer', 'business')),

  -- Communication Details
  type TEXT NOT NULL CHECK (type IN (
    'email', 'sms', 'whatsapp', 'call', 'internal_note', 'system_notification'
  )),
  channel TEXT NOT NULL, -- 'resend', 'clickatell', 'manual', 'system', etc.

  -- Recipients
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_name TEXT,

  -- Content
  subject TEXT,
  message TEXT NOT NULL,
  template_name TEXT, -- Name of email template used
  template_data JSONB, -- Data passed to template

  -- Status Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'sending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked'
  )),

  -- External References
  external_id TEXT, -- ID from email/SMS provider (Resend message ID, Clickatell message ID)
  external_status TEXT, -- Raw status from provider

  -- Delivery Details
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  -- Metadata
  triggered_by_status TEXT, -- Order status that triggered this communication
  triggered_by_user UUID REFERENCES auth.users(id), -- Admin who triggered manual communication
  cost_amount DECIMAL(10,4), -- Cost in ZAR (for SMS/WhatsApp)

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for order_communications
CREATE INDEX idx_order_communications_order ON public.order_communications(order_id);
CREATE INDEX idx_order_communications_type ON public.order_communications(type);
CREATE INDEX idx_order_communications_status ON public.order_communications(status);
CREATE INDEX idx_order_communications_external_id ON public.order_communications(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_order_communications_created ON public.order_communications(created_at DESC);

-- RLS Policies for order_communications
ALTER TABLE public.order_communications ENABLE ROW LEVEL SECURITY;

-- Admin users can view all communications
CREATE POLICY "Admin users can view all communications"
  ON public.order_communications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin users can insert communications"
  ON public.order_communications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "System can insert communications"
  ON public.order_communications
  FOR INSERT
  WITH CHECK (true); -- Allow system inserts (service role)

CREATE POLICY "System can update communications"
  ON public.order_communications
  FOR UPDATE
  USING (true); -- Allow system updates (service role)

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_order_communications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();

  -- Auto-set timestamps based on status changes
  IF NEW.status = 'sent' AND OLD.status != 'sent' THEN
    NEW.sent_at = NOW();
  ELSIF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    NEW.delivered_at = NOW();
  ELSIF NEW.status = 'opened' AND OLD.status != 'opened' THEN
    NEW.opened_at = NOW();
  ELSIF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    NEW.failed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_order_communications_updated_at
  BEFORE UPDATE ON public.order_communications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_communications_updated_at();

-- ============================================================================
-- 4. ORDER STATUS HISTORY TABLE
-- ============================================================================
-- Note: Table already exists with different schema (entity_id, entity_type, old_status, new_status)
-- We'll add indexes and ensure RLS policies are in place

-- Add index for entity_id if not exists
CREATE INDEX IF NOT EXISTS idx_order_status_history_entity ON public.order_status_history(entity_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON public.order_status_history(created_at DESC);

-- Ensure RLS is enabled
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Ensure admin policy exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_status_history' AND policyname = 'Admin users can view status history') THEN
    CREATE POLICY "Admin users can view status history"
      ON public.order_status_history
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.admin_users
          WHERE admin_users.id = auth.uid()
          AND admin_users.is_active = true
        )
      );
  END IF;
END $$;

-- Ensure system insert policy exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_status_history' AND policyname = 'System can insert status history') THEN
    CREATE POLICY "System can insert status history"
      ON public.order_status_history
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- ============================================================================
-- 5. UPDATE CONSUMER_ORDERS STATUS ENUM (Skip KYC for initial release)
-- ============================================================================
-- Note: The consumer_orders table already has order_status enum defined
-- We'll keep the existing enum but enforce workflow via validation function
-- This allows us to add KYC states later without breaking existing data

COMMENT ON TYPE public.order_status IS 'Consumer order workflow statuses. KYC states (kyc_pending, kyc_submitted, kyc_approved, kyc_rejected) are defined but not enforced in initial workflow. Payment method flow starts after pending.';

-- ============================================================================
-- 6. SIMPLIFIED STATUS TRANSITION VALIDATION (Skip KYC)
-- ============================================================================
-- Update the existing validation function to skip KYC states
-- Valid workflow: pending → payment_method_pending → payment_method_registered →
--                 installation_scheduled → installation_in_progress →
--                 installation_completed → active

CREATE OR REPLACE FUNCTION public.validate_order_status_transition_simplified()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow any transition to cancelled
  IF NEW.status = 'cancelled' THEN
    RETURN NEW;
  END IF;

  -- Define valid transitions (skipping KYC states)
  CASE OLD.status
    WHEN 'pending' THEN
      IF NEW.status NOT IN ('payment_method_pending', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from pending to %. Valid transitions: payment_method_pending, cancelled', NEW.status;
      END IF;

    WHEN 'payment_method_pending' THEN
      IF NEW.status NOT IN ('payment_method_registered', 'pending', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from payment_method_pending to %. Valid transitions: payment_method_registered, pending, cancelled', NEW.status;
      END IF;

    WHEN 'payment_method_registered' THEN
      IF NEW.status NOT IN ('installation_scheduled', 'payment_method_pending', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from payment_method_registered to %. Valid transitions: installation_scheduled, payment_method_pending, cancelled', NEW.status;
      END IF;

    WHEN 'installation_scheduled' THEN
      IF NEW.status NOT IN ('installation_in_progress', 'installation_scheduled', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from installation_scheduled to %. Valid transitions: installation_in_progress, cancelled', NEW.status;
      END IF;

    WHEN 'installation_in_progress' THEN
      IF NEW.status NOT IN ('installation_completed', 'installation_scheduled', 'failed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from installation_in_progress to %. Valid transitions: installation_completed, installation_scheduled (rescheduled), failed, cancelled', NEW.status;
      END IF;

    WHEN 'installation_completed' THEN
      IF NEW.status NOT IN ('active', 'failed', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from installation_completed to %. Valid transitions: active, failed, cancelled', NEW.status;
      END IF;

    WHEN 'active' THEN
      IF NEW.status NOT IN ('suspended', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from active to %. Valid transitions: suspended, cancelled', NEW.status;
      END IF;

    WHEN 'suspended' THEN
      IF NEW.status NOT IN ('active', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from suspended to %. Valid transitions: active, cancelled', NEW.status;
      END IF;

    WHEN 'failed' THEN
      IF NEW.status NOT IN ('installation_scheduled', 'cancelled') THEN
        RAISE EXCEPTION 'Invalid status transition from failed to %. Valid transitions: installation_scheduled (retry), cancelled', NEW.status;
      END IF;

    WHEN 'cancelled' THEN
      -- Cannot transition from cancelled
      RAISE EXCEPTION 'Cannot change status from cancelled';

    ELSE
      -- For any other status (including KYC states if manually set), be permissive
      -- This allows future addition of KYC workflow without breaking
      NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enable the trigger (replacing any existing validation trigger)
DROP TRIGGER IF EXISTS trigger_validate_order_status_transition ON public.consumer_orders;
CREATE TRIGGER trigger_validate_order_status_transition
  BEFORE UPDATE OF status ON public.consumer_orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.validate_order_status_transition_simplified();

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get next allowed statuses for an order
CREATE OR REPLACE FUNCTION public.get_allowed_next_statuses(current_status TEXT)
RETURNS TEXT[] AS $$
BEGIN
  RETURN CASE current_status
    WHEN 'pending' THEN ARRAY['payment_method_pending', 'cancelled']::TEXT[]
    WHEN 'payment_method_pending' THEN ARRAY['payment_method_registered', 'cancelled']::TEXT[]
    WHEN 'payment_method_registered' THEN ARRAY['installation_scheduled', 'cancelled']::TEXT[]
    WHEN 'installation_scheduled' THEN ARRAY['installation_in_progress', 'cancelled']::TEXT[]
    WHEN 'installation_in_progress' THEN ARRAY['installation_completed', 'failed', 'cancelled']::TEXT[]
    WHEN 'installation_completed' THEN ARRAY['active', 'failed', 'cancelled']::TEXT[]
    WHEN 'active' THEN ARRAY['suspended', 'cancelled']::TEXT[]
    WHEN 'suspended' THEN ARRAY['active', 'cancelled']::TEXT[]
    WHEN 'failed' THEN ARRAY['installation_scheduled', 'cancelled']::TEXT[]
    WHEN 'cancelled' THEN ARRAY[]::TEXT[] -- No transitions from cancelled
    ELSE ARRAY['cancelled']::TEXT[] -- Default: can always cancel
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if technician is available on a date
CREATE OR REPLACE FUNCTION public.is_technician_available(
  p_technician_id UUID,
  p_date DATE,
  p_time_slot TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_day_name TEXT;
  v_working_hours JSONB;
  v_task_count INTEGER;
BEGIN
  -- Check if technician exists and is active
  SELECT is_active INTO STRICT v_working_hours
  FROM public.technicians
  WHERE id = p_technician_id;

  IF NOT FOUND OR v_working_hours = false THEN
    RETURN false;
  END IF;

  -- Get day of week
  v_day_name := LOWER(TO_CHAR(p_date, 'Day'));
  v_day_name := TRIM(v_day_name);

  -- Check working hours for that day
  SELECT working_hours -> v_day_name INTO v_working_hours
  FROM public.technicians
  WHERE id = p_technician_id;

  IF v_working_hours IS NULL OR v_working_hours = 'null'::JSONB THEN
    RETURN false; -- Not working on this day
  END IF;

  -- Check how many tasks already scheduled for that day/slot
  SELECT COUNT(*) INTO v_task_count
  FROM public.installation_tasks
  WHERE technician_id = p_technician_id
    AND scheduled_date = p_date
    AND status IN ('scheduled', 'in_progress')
    AND (p_time_slot IS NULL OR scheduled_time_slot = p_time_slot);

  -- Allow max 4 tasks per day (2 morning, 2 afternoon) or 2 per slot
  IF p_time_slot IS NOT NULL THEN
    RETURN v_task_count < 2;
  ELSE
    RETURN v_task_count < 4;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- 8. GRANTS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.technicians TO authenticated;
GRANT SELECT ON public.installation_tasks TO authenticated;
GRANT SELECT ON public.order_communications TO authenticated;
GRANT SELECT ON public.order_status_history TO authenticated;

-- Service role has full access
GRANT ALL ON public.technicians TO service_role;
GRANT ALL ON public.installation_tasks TO service_role;
GRANT ALL ON public.order_communications TO service_role;
GRANT ALL ON public.order_status_history TO service_role;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comments for documentation
COMMENT ON TABLE public.technicians IS 'Technicians who perform installation tasks. Tracks availability, specialties, and performance statistics.';
COMMENT ON TABLE public.installation_tasks IS 'Installation tasks linked to consumer orders. Tracks scheduling, progress, equipment, and completion details.';
COMMENT ON TABLE public.order_communications IS 'Audit trail of all communications sent for orders (email, SMS, WhatsApp). Tracks delivery status and costs.';
COMMENT ON TABLE public.order_status_history IS 'Complete audit trail of all status changes for orders with timestamps and admin notes.';
COMMENT ON FUNCTION public.get_allowed_next_statuses(TEXT) IS 'Returns array of valid next status values based on current status. Used for workflow validation.';
COMMENT ON FUNCTION public.is_technician_available(UUID, DATE, TEXT) IS 'Checks if technician is available on a specific date/time slot based on working hours and existing tasks.';
