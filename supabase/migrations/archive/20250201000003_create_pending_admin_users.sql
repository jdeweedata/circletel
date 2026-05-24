-- Create pending_admin_users table for access requests
CREATE TABLE IF NOT EXISTS pending_admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  requested_role TEXT NOT NULL CHECK (requested_role IN ('product_manager', 'editor', 'viewer')),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES admin_users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_pending_admin_users_email ON pending_admin_users(email);
CREATE INDEX IF NOT EXISTS idx_pending_admin_users_status ON pending_admin_users(status);
CREATE INDEX IF NOT EXISTS idx_pending_admin_users_created_at ON pending_admin_users(created_at DESC);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER pending_admin_users_updated_at_trigger
  BEFORE UPDATE ON pending_admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Enable Row Level Security
ALTER TABLE pending_admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY pending_admin_users_select_own
  ON pending_admin_users
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Policy: Super admins can view all requests
CREATE POLICY pending_admin_users_select_super_admin
  ON pending_admin_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Policy: Anyone can insert a request (signup)
CREATE POLICY pending_admin_users_insert_public
  ON pending_admin_users
  FOR INSERT
  WITH CHECK (true);

-- Policy: Super admins can update requests (approve/reject)
CREATE POLICY pending_admin_users_update_super_admin
  ON pending_admin_users
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE id::text = auth.uid()::text
      AND role = 'super_admin'
      AND is_active = true
    )
  );

-- Function to approve admin access request
CREATE OR REPLACE FUNCTION approve_admin_access_request(
  p_request_id UUID,
  p_password TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_request pending_admin_users;
  v_user_id UUID;
  v_auth_user_id UUID;
BEGIN
  -- Get the pending request
  SELECT * INTO v_request
  FROM pending_admin_users
  WHERE id = p_request_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request not found or already processed'
    );
  END IF;

  -- Create Supabase Auth user
  -- Note: This needs to be called from Edge Function with service role
  -- Here we just mark as approved and return the info

  -- Update request status
  UPDATE pending_admin_users
  SET
    status = 'approved',
    reviewed_by = auth.uid(),
    reviewed_at = NOW()
  WHERE id = p_request_id;

  -- Return success with user details
  RETURN jsonb_build_object(
    'success', true,
    'email', v_request.email,
    'full_name', v_request.full_name,
    'role', v_request.requested_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject admin access request
CREATE OR REPLACE FUNCTION reject_admin_access_request(
  p_request_id UUID,
  p_reason TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_request pending_admin_users;
BEGIN
  -- Get the pending request
  SELECT * INTO v_request
  FROM pending_admin_users
  WHERE id = p_request_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Request not found or already processed'
    );
  END IF;

  -- Update request status
  UPDATE pending_admin_users
  SET
    status = 'rejected',
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    rejection_reason = p_reason
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Request rejected successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
