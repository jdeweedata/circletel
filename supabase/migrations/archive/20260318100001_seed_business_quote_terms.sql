-- Idempotent: clear existing v1 seed data before re-inserting
-- Safe because these are system-managed terms, not user-edited
DELETE FROM business_quote_terms WHERE version = 1;

-- Default terms (apply to ALL quotes regardless of product)
INSERT INTO business_quote_terms (service_type, contract_term, title, terms_text, version, active, display_order) VALUES
('_default', NULL, 'Quote Validity',
 'This quote is valid for 30 days from the date of issue. Pricing is subject to change after this period. All prices are quoted in South African Rands (ZAR) and include 15% VAT unless otherwise stated.',
 1, true, 1),
('_default', NULL, 'Payment Terms',
 'Monthly charges are payable in advance on the 1st of each month. Installation fees are due upon contract signing or before installation commences. Late payments attract interest at the prescribed rate under the National Credit Act.',
 1, true, 2),
('_default', NULL, 'Cancellation',
 '30 days written notice is required for cancellation. Early termination fees may apply for fixed-term contracts, calculated as the remaining months multiplied by the monthly fee. Month-to-month contracts may be cancelled with 30 days notice without penalty.',
 1, true, 3),
('_default', NULL, 'Equipment',
 'Customer Premises Equipment (CPE) including routers, antennas, and ONTs remains the property of CircleTel and must be returned in good condition upon service termination. Failure to return equipment will result in equipment charges at replacement cost.',
 1, true, 4),
('_default', NULL, 'Governing Law',
 'This agreement is governed by the laws of the Republic of South Africa. Disputes will be resolved in accordance with the Consumer Protection Act and ICASA regulations. Full terms and conditions are available at www.circletel.co.za/terms-of-service.',
 1, true, 5);

-- SkyFibre (Fixed Wireless Broadband) terms
INSERT INTO business_quote_terms (service_type, contract_term, title, terms_text, version, active, display_order) VALUES
('SkyFibre', NULL, 'Installation & Activation',
 'Installation will be scheduled within 7-14 business days of order confirmation, subject to a successful site survey and line-of-sight assessment. A Tarana G1 fixed wireless unit will be installed at the premises. Professional installation includes mounting, cabling, and router configuration. The customer must provide suitable access and infrastructure.',
 1, true, 10),
('SkyFibre', NULL, 'Service Level Agreement',
 'CircleTel provides a 99.5% uptime SLA measured monthly, excluding scheduled maintenance windows. Fault acknowledgment within 4 hours. Resolution targets: Critical (total outage) 24 hours, Major (degraded) 48 hours, Minor (intermittent) 72 hours. Service credits apply for verified outages exceeding SLA thresholds, capped at one month''s service fee.',
 1, true, 11),
('SkyFibre', NULL, 'Fair Usage Policy',
 'Uncapped packages have no hard data caps and are not subject to throttling under normal usage. CircleTel reserves the right to manage traffic during peak periods (18:00-23:00) to ensure fair usage across all customers. Priority is given to VoIP, video conferencing, and web browsing. Commercial reselling of bandwidth is prohibited.',
 1, true, 12),
('SkyFibre', NULL, 'Speed & Performance',
 'Advertised speeds are measured at the CPE and represent maximum achievable speeds. Minimum guaranteed speed is 80% of the advertised speed. Actual performance may vary based on line-of-sight conditions, weather, network congestion, and the number of concurrent users. Speed tests should be conducted via wired connection for accurate results.',
 1, true, 13);

-- BizFibreConnect (DFA Dark Fibre) terms
INSERT INTO business_quote_terms (service_type, contract_term, title, terms_text, version, active, display_order) VALUES
('BizFibreConnect', NULL, 'Installation & Activation',
 'Fibre installation is coordinated with Dark Fibre Africa (DFA) and typically takes 14-21 business days from order confirmation. This includes fibre routing, ONT installation, and service activation. A 24-48 hour stabilisation period follows activation. Delays may occur due to wayleave approvals or infrastructure work.',
 1, true, 10),
('BizFibreConnect', NULL, 'Service Level Agreement',
 'Enterprise-grade 99.9% uptime SLA measured monthly with dedicated support. Fault acknowledgment within 2 hours. Resolution targets: Critical 12 hours, Major 24 hours. Service credits for outages exceeding SLA thresholds. Dedicated account manager and priority escalation path for enterprise customers.',
 1, true, 11),
('BizFibreConnect', NULL, 'Performance',
 'Symmetric upload and download speeds as per selected package. Active Ethernet delivery via DFA infrastructure. Enterprise-grade routing with QoS capabilities. Cloud-ready performance optimised for business applications including VoIP, video conferencing, and cloud services.',
 1, true, 12);

-- 5G terms
INSERT INTO business_quote_terms (service_type, contract_term, title, terms_text, version, active, display_order) VALUES
('5G', NULL, 'Coverage & Eligibility',
 'Service availability is dependent on 5G/LTE network coverage at the specified address. A coverage check is performed before order acceptance. Coverage is subject to cellular network availability and may vary by location. CircleTel does not guarantee coverage at all locations.',
 1, true, 10),
('5G', NULL, 'Installation',
 'Self-installation kit provided with pre-configured router and activated SIM card. Professional installation available at R750 (including external antenna installation if required, signal optimisation, and multi-device setup). Signal strength assessment tools are included in the self-install kit.',
 1, true, 11),
('5G', NULL, 'Data & Fair Usage',
 'Capped packages: data limit as per selected package. Service is throttled to 1 Mbps after the data cap is reached. Top-up data is available for purchase. Uncapped packages are subject to the Fair Usage Policy. Commercial reselling and operating public hotspots is prohibited on all packages.',
 1, true, 12),
('5G', NULL, 'Performance Expectations',
 '5G speeds up to 500 Mbps (coverage dependent). LTE speeds up to 100 Mbps (typical 20-50 Mbps). Latency: 20-80ms (higher than fibre). Performance is affected by distance from tower, weather conditions, network congestion, tower capacity, and line of sight. Speeds are not guaranteed.',
 1, true, 13);
