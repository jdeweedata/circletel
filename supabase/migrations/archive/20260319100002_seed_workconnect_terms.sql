-- Idempotent: clear existing WorkConnect terms before re-inserting
DELETE FROM business_quote_terms WHERE service_type = 'WorkConnect' AND version = 1;

INSERT INTO business_quote_terms (service_type, contract_term, title, terms_text, version, active, display_order) VALUES
('WorkConnect', NULL, 'Installation & Setup',
 'Professional installation will be scheduled within 7-10 business days of order confirmation. A Reyee router pre-configured with Ruijie Cloud management will be installed and optimised. The customer must provide suitable power and mounting access. Installation fee applies as per selected tier (waived on Pro tier).',
 1, true, 10),
('WorkConnect', NULL, 'Service Level Target',
 '99% uptime target (best-effort, not SLA-backed) for WorkConnect Starter and Plus tiers. 99.5% uptime target with service credits for WorkConnect Pro tier. Targets exclude scheduled maintenance windows and upstream provider outages. This is not a contractual SLA — for guaranteed uptime with service credits on all tiers, consider SkyFibre SME packages.',
 1, true, 11),
('WorkConnect', NULL, 'Support Hours',
 'Extended support available Mon-Sat 07:00-19:00 via phone, email, and WhatsApp. WorkConnect Pro tier receives WhatsApp priority queue access. Response times: Starter 12 business hours, Plus 8 business hours, Pro 4 business hours. On-site visits available at R500 per visit (Plus: 1 free per year, Pro: 2 free per year).',
 1, true, 12),
('WorkConnect', NULL, 'Contract & Flexibility',
 'Month-to-month contracts available on all WorkConnect tiers with 30 days written cancellation notice. 12 and 24-month terms available. Router and CPE remain CircleTel property and must be returned in good condition upon service termination. Early termination fees apply to fixed-term contracts only.',
 1, true, 13);
