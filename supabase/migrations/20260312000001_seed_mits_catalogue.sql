-- Seed: MITS catalogue data
-- Source: CT-MITS-CPS-2026-002

-- M365 Pricing (from Link-up ICT CSP rates)
INSERT INTO mits_m365_pricing (licence_type, licence_name, retail_price, csp_cost, features) VALUES
('business_basic', 'Microsoft 365 Business Basic', 179.00, 149.00, '{"exchange": true, "teams": true, "sharepoint": true, "onedrive": "1TB"}'),
('business_standard', 'Microsoft 365 Business Standard', 329.00, 270.00, '{"exchange": true, "teams": true, "sharepoint": true, "onedrive": "1TB", "desktop_apps": true}'),
('business_premium', 'Microsoft 365 Business Premium', 549.00, 450.00, '{"exchange": true, "teams": true, "sharepoint": true, "onedrive": "1TB", "desktop_apps": true, "intune": true, "azure_ad_p1": true}'),
('e3', 'Microsoft 365 E3', 799.00, 650.00, '{"exchange": true, "teams": true, "sharepoint": true, "onedrive": "unlimited", "desktop_apps": true, "intune": true, "azure_ad_p1": true, "compliance": true}');

-- Tier Catalogue
INSERT INTO mits_tier_catalogue (
    tier_code, tier_name, description,
    target_users_min, target_users_max, retail_price,
    connectivity_speed_dl, connectivity_speed_ul, static_ip_included, lte_failover_included, skyfibre_product_code,
    m365_licence_type, m365_included_licences, m365_additional_rate,
    support_hours, sla_response_p1, sla_response_p2, sla_response_p3, sla_resolution_p1, onsite_included, onsite_visit_rate,
    firewall_included, endpoint_protection, backup_storage_gb, security_training,
    uptime_guarantee, service_credit_rate,
    estimated_direct_cost, target_margin_percent, sort_order
) VALUES
(
    'MITS_ESSENTIAL', 'Essential', 'IT essentials for SOHO and startups',
    1, 10, 2999.00,
    50, 25, 1, false, 'SKYFIBRE_SMB_50',
    'business_basic', 5, 179.00,
    'Mon-Fri 08:00-17:00', 4.0, 8.0, 24.0, 24, 'None', 850.00,
    false, true, 0, NULL,
    99.00, 5.00,
    1740.00, 42.00, 1
),
(
    'MITS_PROFESSIONAL', 'Professional', 'Full IT support for growing businesses',
    10, 25, 5999.00,
    100, 50, 1, true, 'SKYFIBRE_SMB_100',
    'business_standard', 10, 329.00,
    'Mon-Sat 07:00-19:00', 2.0, 4.0, 8.0, 8, 'Quarterly', NULL,
    true, true, 500, NULL,
    99.50, 10.00,
    3300.00, 45.00, 2
),
(
    'MITS_PREMIUM', 'Premium', 'Enterprise-grade IT for ambitious SMEs',
    25, 50, 12999.00,
    200, 100, 2, true, 'SKYFIBRE_SMB_200',
    'business_premium', 15, 549.00,
    '24x7', 1.0, 2.0, 4.0, 4, 'Monthly', NULL,
    true, true, 1024, 'Quarterly',
    99.90, 15.00,
    6760.00, 48.00, 3
),
(
    'MITS_ENTERPRISE', 'Enterprise', 'Custom solutions for mid-market',
    50, 100, 35000.00,
    500, 250, 4, true, 'SKYFIBRE_SMB_500',
    'e3', 20, 799.00,
    '24x7 Priority', 0.5, 1.0, 2.0, 2, 'Weekly', NULL,
    true, true, 0, 'Monthly',
    99.95, 20.00,
    16800.00, 52.00, 4
);

-- Module Catalogue
INSERT INTO mits_module_catalogue (module_code, module_name, description, retail_price, direct_cost, billing_type, available_from_tier, sort_order) VALUES
('MOD_LTE_FAILOVER', 'LTE Failover', 'Automatic 4G/5G backup connectivity', 499.00, 299.00, 'monthly', 'MITS_ESSENTIAL', 1),
('MOD_STATIC_IP', 'Additional Static IP', 'Extra static IP address', 150.00, 50.00, 'monthly', 'MITS_ESSENTIAL', 2),
('MOD_BACKUP_EXT', 'Extended Backup', 'Additional 500GB cloud backup', 299.00, 150.00, 'monthly', 'MITS_PROFESSIONAL', 3),
('MOD_ADV_SECURITY', 'Advanced Security', 'EDR, SIEM, threat hunting', 1500.00, 900.00, 'monthly', 'MITS_PROFESSIONAL', 4),
('MOD_ACCOUNT_MGR', 'Dedicated Account Manager', 'Named account manager', 2000.00, 1200.00, 'monthly', 'MITS_PREMIUM', 5),
('MOD_WEB_MAINT', 'Website Maintenance', '4 hours/month updates', 999.00, 400.00, 'monthly', 'MITS_PROFESSIONAL', 6),
('MOD_WEB_DEV', 'Website Development', 'Custom website build', 15000.00, 8000.00, 'once_off', 'MITS_ESSENTIAL', 7),
('MOD_SEC_TRAINING', 'Security Awareness Training', 'Quarterly phishing simulations', 50.00, 25.00, 'per_user', 'MITS_ESSENTIAL', 8),
('MOD_DR_TEST', 'Disaster Recovery Testing', 'Bi-annual DR test', 5000.00, 2500.00, 'once_off', 'MITS_PREMIUM', 9);
