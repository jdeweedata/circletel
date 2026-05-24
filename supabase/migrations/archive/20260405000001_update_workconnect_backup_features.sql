-- Update WorkConnect SOHO feature arrays: cloud backup changed from bundled to add-on model.
-- Decision (2026-04-05): Backup is a paid add-on on Starter/Plus; 25 GB included on Pro only.

-- WorkConnect Starter: remove cloud backup, add add-on mention
UPDATE service_packages
SET
  features = ARRAY[
    'Uncapped data, no FUP',
    'VoIP QoS included',
    '2 business email accounts',
    'Reyee WiFi 5 router (free to use)',
    'Extended support Mon-Sat 07:00-19:00',
    '12 business hour response time',
    '99% uptime target',
    'Month-to-month or 12/24 month contract',
    'R900 installation fee',
    'Cloud backup add-on from R79/mo'
  ]
WHERE slug = 'workconnect-starter' AND service_type = 'WorkConnect';

-- WorkConnect Plus: remove cloud backup, add add-on mention
UPDATE service_packages
SET
  features = ARRAY[
    'Uncapped data, no FUP',
    'VoIP QoS included',
    '5 business email accounts',
    'Reyee Business Gateway router (free to use)',
    '3 concurrent VPN tunnels',
    'Extended support Mon-Sat 07:00-19:00',
    '8 business hour response time',
    '99% uptime target',
    'Month-to-month or 12/24 month contract',
    'R900 installation fee',
    'Cloud backup add-on from R79/mo'
  ]
WHERE slug = 'workconnect-plus' AND service_type = 'WorkConnect';

-- WorkConnect Pro: change from 100 GB bundled to 25 GB included (honest capacity at launch)
UPDATE service_packages
SET
  features = ARRAY[
    'Uncapped data, no FUP',
    'VoIP QoS with full traffic shaping',
    '25 GB cloud backup included',
    '10 business email accounts',
    '1 static IP included',
    'Reyee Business Gateway router (free to use)',
    '5 concurrent VPN tunnels',
    'Remote Desktop optimised (RDP/Citrix)',
    'WhatsApp priority support',
    '4 business hour response time',
    '99.5% uptime target with service credits',
    'Month-to-month or 12/24 month contract',
    'FREE installation (valued at R1,500)'
  ]
WHERE slug = 'workconnect-pro' AND service_type = 'WorkConnect';
