-- Consumer compliance-document RLS was keyed on `customer_id = auth.uid()`, but compliance_documents.customer_id
-- stores customers.id (NOT the auth user id). That mismatch meant no customer could ever read/insert their own
-- docs (0 rows ever uploaded). Remap the customer policies through customers.auth_user_id -> customers.id.
-- Admin policies (compliance_documents_admin_select/update) are unchanged.

DROP POLICY IF EXISTS compliance_documents_select_own ON public.compliance_documents;
CREATE POLICY compliance_documents_select_own ON public.compliance_documents
  FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS compliance_documents_insert_own ON public.compliance_documents;
CREATE POLICY compliance_documents_insert_own ON public.compliance_documents
  FOR INSERT TO authenticated
  WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS compliance_documents_update_own ON public.compliance_documents;
CREATE POLICY compliance_documents_update_own ON public.compliance_documents
  FOR UPDATE TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()) AND status = 'pending')
  WITH CHECK (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()) AND status = 'pending');

DROP POLICY IF EXISTS compliance_documents_delete_own ON public.compliance_documents;
CREATE POLICY compliance_documents_delete_own ON public.compliance_documents
  FOR DELETE TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE auth_user_id = auth.uid()) AND status = 'pending');
