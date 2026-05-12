-- Unjani WhatsApp Consent Migration
-- Sets whatsapp_consent=true for all nurse customers linked to Unjani corporate sites
-- Enables WhatsApp PayNow payment links for invoice reminders

UPDATE customers
SET whatsapp_consent = true,
    whatsapp_consent_at = now(),
    whatsapp_consent_source = 'admin_import',
    updated_at = now()
WHERE corporate_site_id IN (
  SELECT id FROM corporate_sites
  WHERE corporate_id = '9b6b601f-9b51-42e7-8b97-af7ae9d3486e'
    AND status = 'active'
)
AND (whatsapp_consent IS NULL OR whatsapp_consent = false);
