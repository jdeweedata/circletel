-- The private `kyc-documents` bucket had NO RLS policies on storage.objects, so browser-side uploads from the
-- customer portal were always denied. Files are stored under `{customers.id}/{order_id}/{category}/{type}/{file}`,
-- so scope authenticated access to the first path segment matching the user's own customers.id. Admins read all.
-- Service-role (server) access bypasses RLS and is unaffected.

DROP POLICY IF EXISTS kyc_docs_customer_insert ON storage.objects;
CREATE POLICY kyc_docs_customer_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.customers WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS kyc_docs_customer_select ON storage.objects;
CREATE POLICY kyc_docs_customer_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.customers WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS kyc_docs_customer_delete ON storage.objects;
CREATE POLICY kyc_docs_customer_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] IN (SELECT id::text FROM public.customers WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS kyc_docs_admin_select ON storage.objects;
CREATE POLICY kyc_docs_admin_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE id = auth.uid() AND role = ANY (ARRAY['super_admin','admin','compliance_officer'])
    )
  );
