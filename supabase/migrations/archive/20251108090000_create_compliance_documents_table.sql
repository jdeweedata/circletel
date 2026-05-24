-- =====================================================
-- FICA/RICA Compliance Documents System
-- Created: 2025-11-08
-- Purpose: Store customer compliance documents for FICA/RICA
-- =====================================================

-- Create compliance_documents table
CREATE TABLE IF NOT EXISTS compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to order and customer
  order_id UUID REFERENCES consumer_orders(id) ON DELETE CASCADE,
  customer_id UUID,

  -- Document classification
  category TEXT NOT NULL CHECK (category IN ('fica', 'rica')),
  document_type TEXT NOT NULL,

  -- File information
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_url TEXT,
  mime_type TEXT NOT NULL,

  -- Document metadata
  metadata JSONB DEFAULT '{}',

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,

  -- Audit fields
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES admin_users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_compliance_documents_order_id ON compliance_documents(order_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_customer_id ON compliance_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_category ON compliance_documents(category);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_status ON compliance_documents(status);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_uploaded_at ON compliance_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_documents_category_type ON compliance_documents(category, document_type);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_compliance_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_compliance_documents_updated_at
  BEFORE UPDATE ON compliance_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_compliance_documents_updated_at();

-- Create trigger to set reviewed_at when status changes
CREATE OR REPLACE FUNCTION set_compliance_reviewed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    NEW.reviewed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_compliance_reviewed_at
  BEFORE UPDATE ON compliance_documents
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION set_compliance_reviewed_at();

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Customers can view their own documents
CREATE POLICY compliance_documents_select_own
  ON compliance_documents
  FOR SELECT
  USING (customer_id = auth.uid());

-- Policy: Customers can insert their own documents
CREATE POLICY compliance_documents_insert_own
  ON compliance_documents
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

-- Policy: Customers can update their own pending documents
CREATE POLICY compliance_documents_update_own
  ON compliance_documents
  FOR UPDATE
  USING (customer_id = auth.uid() AND status = 'pending')
  WITH CHECK (customer_id = auth.uid() AND status = 'pending');

-- Policy: Customers can delete their own pending documents
CREATE POLICY compliance_documents_delete_own
  ON compliance_documents
  FOR DELETE
  USING (customer_id = auth.uid() AND status = 'pending');

-- Policy: Admins can view all documents
CREATE POLICY compliance_documents_admin_select
  ON compliance_documents
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('super_admin', 'admin', 'compliance_officer')
    )
  );

-- Policy: Admins can update all documents (for review)
CREATE POLICY compliance_documents_admin_update
  ON compliance_documents
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.role IN ('super_admin', 'admin', 'compliance_officer')
    )
  );

-- =====================================================
-- Views
-- =====================================================

-- View: Order compliance summary
CREATE OR REPLACE VIEW v_order_compliance_summary AS
SELECT
  co.id AS order_id,
  co.order_number,
  co.first_name || ' ' || co.last_name AS customer_name,
  co.email,

  -- FICA documents count
  COUNT(*) FILTER (WHERE cd.category = 'fica' AND cd.status = 'pending') AS fica_pending,
  COUNT(*) FILTER (WHERE cd.category = 'fica' AND cd.status = 'approved') AS fica_approved,
  COUNT(*) FILTER (WHERE cd.category = 'fica' AND cd.status = 'rejected') AS fica_rejected,

  -- RICA documents count
  COUNT(*) FILTER (WHERE cd.category = 'rica' AND cd.status = 'pending') AS rica_pending,
  COUNT(*) FILTER (WHERE cd.category = 'rica' AND cd.status = 'approved') AS rica_approved,
  COUNT(*) FILTER (WHERE cd.category = 'rica' AND cd.status = 'rejected') AS rica_rejected,

  -- Overall status
  CASE
    WHEN COUNT(*) FILTER (WHERE cd.status = 'rejected') > 0 THEN 'rejected'
    WHEN COUNT(*) FILTER (WHERE cd.status = 'pending') > 0 THEN 'pending'
    WHEN COUNT(*) FILTER (WHERE cd.status = 'approved') >= 4 THEN 'complete' -- 2 FICA + 2 RICA minimum
    ELSE 'incomplete'
  END AS compliance_status,

  MIN(cd.uploaded_at) AS first_upload,
  MAX(cd.reviewed_at) AS last_review

FROM consumer_orders co
LEFT JOIN compliance_documents cd ON co.id = cd.order_id
GROUP BY co.id, co.order_number, co.first_name, co.last_name, co.email;

-- View: Pending compliance reviews
CREATE OR REPLACE VIEW v_pending_compliance_reviews AS
SELECT
  cd.id,
  cd.order_id,
  co.order_number,
  co.first_name || ' ' || co.last_name AS customer_name,
  co.email,
  cd.category,
  cd.document_type,
  cd.file_name,
  cd.file_url,
  cd.uploaded_at,
  EXTRACT(EPOCH FROM (NOW() - cd.uploaded_at)) / 3600 AS hours_pending
FROM compliance_documents cd
JOIN consumer_orders co ON cd.order_id = co.id
WHERE cd.status = 'pending'
ORDER BY cd.uploaded_at ASC;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Get order compliance status
CREATE OR REPLACE FUNCTION get_order_compliance_status(p_order_id UUID)
RETURNS TABLE (
  fica_complete BOOLEAN,
  rica_complete BOOLEAN,
  overall_complete BOOLEAN,
  pending_count INTEGER,
  rejected_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE category = 'fica' AND status = 'approved') >= 2 AS fica_complete,
    COUNT(*) FILTER (WHERE category = 'rica' AND status = 'approved') >= 2 AS rica_complete,
    COUNT(*) FILTER (WHERE status = 'approved') >= 4 AS overall_complete,
    COUNT(*) FILTER (WHERE status = 'pending')::INTEGER AS pending_count,
    COUNT(*) FILTER (WHERE status = 'rejected')::INTEGER AS rejected_count
  FROM compliance_documents
  WHERE order_id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if customer has uploaded required FICA/RICA documents
CREATE OR REPLACE FUNCTION has_required_compliance_documents(p_order_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_fica_id BOOLEAN;
  v_has_fica_address BOOLEAN;
  v_has_rica_id BOOLEAN;
  v_has_rica_residence BOOLEAN;
BEGIN
  -- Check FICA identity document
  SELECT EXISTS (
    SELECT 1 FROM compliance_documents
    WHERE order_id = p_order_id
    AND category = 'fica'
    AND document_type IN ('id_document', 'passport', 'drivers_license')
    AND status = 'approved'
  ) INTO v_has_fica_id;

  -- Check FICA address document
  SELECT EXISTS (
    SELECT 1 FROM compliance_documents
    WHERE order_id = p_order_id
    AND category = 'fica'
    AND document_type = 'proof_of_address'
    AND status = 'approved'
  ) INTO v_has_fica_address;

  -- Check RICA identity document
  SELECT EXISTS (
    SELECT 1 FROM compliance_documents
    WHERE order_id = p_order_id
    AND category = 'rica'
    AND document_type IN ('id_document', 'passport', 'asylum_document')
    AND status = 'approved'
  ) INTO v_has_rica_id;

  -- Check RICA residence document
  SELECT EXISTS (
    SELECT 1 FROM compliance_documents
    WHERE order_id = p_order_id
    AND category = 'rica'
    AND document_type = 'proof_of_residence'
    AND status = 'approved'
  ) INTO v_has_rica_residence;

  RETURN v_has_fica_id AND v_has_fica_address AND v_has_rica_id AND v_has_rica_residence;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Sample Data for Testing (Optional - Comment out for production)
-- =====================================================

/*
-- Test document upload for Shaun's order
INSERT INTO compliance_documents (
  order_id,
  customer_id,
  category,
  document_type,
  file_name,
  file_size,
  file_path,
  file_url,
  mime_type,
  status
)
SELECT
  id AS order_id,
  customer_id,
  'fica' AS category,
  'id_document' AS document_type,
  'south_african_id_123456789.pdf' AS file_name,
  524288 AS file_size, -- 512KB
  'customer_id/order_id/fica/id_document/south_african_id_123456789_1699999999.pdf' AS file_path,
  'https://storage.supabase.co/...' AS file_url,
  'application/pdf' AS mime_type,
  'pending' AS status
FROM consumer_orders
WHERE order_number = 'ORD-20251108-9841'
LIMIT 1;
*/

-- =====================================================
-- Grants
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON compliance_documents TO authenticated;
GRANT SELECT ON v_order_compliance_summary TO authenticated;
GRANT SELECT ON v_pending_compliance_reviews TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_compliance_status TO authenticated;
GRANT EXECUTE ON FUNCTION has_required_compliance_documents TO authenticated;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE compliance_documents IS 'FICA/RICA compliance documents uploaded by customers';
COMMENT ON COLUMN compliance_documents.category IS 'Document category: fica or rica';
COMMENT ON COLUMN compliance_documents.document_type IS 'Type of document (id_document, proof_of_address, etc.)';
COMMENT ON COLUMN compliance_documents.metadata IS 'JSON metadata (document_number, expiry_date, etc.)';
COMMENT ON COLUMN compliance_documents.status IS 'Document review status: pending, approved, rejected';

COMMENT ON VIEW v_order_compliance_summary IS 'Summary of compliance document status per order';
COMMENT ON VIEW v_pending_compliance_reviews IS 'Documents pending compliance review';

COMMENT ON FUNCTION get_order_compliance_status IS 'Get compliance completion status for an order';
COMMENT ON FUNCTION has_required_compliance_documents IS 'Check if order has all required approved documents';
