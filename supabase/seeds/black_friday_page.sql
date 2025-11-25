-- Seed a Black Friday Promo Page into the CMS
-- Run this in Supabase SQL Editor

INSERT INTO cms_pages (
  slug,
  title,
  content_type,
  status,
  author_id,
  seo_metadata,
  content
)
SELECT 
  'black-friday-2025', -- Slug
  'Black Friday Fibre Specials', -- Title
  'landing', -- Type
  'published', -- Status (Immediately published)
  id as author_id, -- Assign to the first admin user found (usually devadmin)
  '{"metaTitle": "Black Friday Fibre Deals | CircleTel", "metaDescription": "Get up to 40% OFF on Uncapped Fibre. Free Installation & Router. Limited time offer.", "keywords": ["black friday", "fibre deals", "internet specials"]}'::jsonb,
  '{
    "theme": "black_friday",
    "hero": {
      "headline": "BLACK FRIDAY MADNESS",
      "subheadline": "Ignite your connectivity with massive savings. Up to 40% OFF on Business & Home Fibre.",
      "cta_primary": "Claim Deal",
      "cta_primary_url": "#deals",
      "cta_secondary": "Check Coverage",
      "cta_secondary_url": "/coverage",
      "background_image": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
    },
    "sections": [
      {
        "type": "features",
        "heading": "Why This Is The Best Time To Switch",
        "subheadline": "We''ve slashed prices, not quality.",
        "layout": "grid-3",
        "items": [
          {
            "title": "Free Installation",
            "description": "Save R1 725 immediately. We cover the full installation cost for new sign-ups.",
            "icon": "Zap"
          },
          {
            "title": "Free 5G Router",
            "description": "Get a premium dual-band Wi-Fi 6 router included with your package.",
            "icon": "Globe"
          },
          {
            "title": "Month-to-Month",
            "description": "No long-term lock-ins. We believe our service keeps you, not a contract.",
            "icon": "Shield"
          }
        ]
      },
      {
        "type": "pricing",
        "heading": "Limited Time Offers",
        "subheadline": "Choose the speed that matches your ambition.",
        "items": [
          {
            "title": "Home Starter 50",
            "price": "R499",
            "original_price": "R699",
            "period": "pm",
            "badge": "SAVE R200",
            "features": [
              "50Mbps Download / Upload",
              "Uncapped & Unshaped",
              "Free Installation",
              "Free Router"
            ],
            "cta_text": "Get Started",
            "cta_url": "/order/home-50",
            "highlight": false
          },
          {
            "title": "Business Pro 100",
            "price": "R799",
            "original_price": "R1199",
            "period": "pm",
            "badge": "BEST VALUE",
            "features": [
              "100Mbps Symmetrical",
              "Priority Business Support",
              "Static IP Included",
              "99.9% SLA Guarantee"
            ],
            "cta_text": "Upgrade Business",
            "cta_url": "/order/business-100",
            "highlight": true
          },
          {
            "title": "Enterprise 500",
            "price": "R1499",
            "original_price": "R1999",
            "period": "pm",
            "badge": "BLAZING FAST",
            "features": [
              "500Mbps Blazing Speed",
              "Dedicated Account Manager",
              "5 Static IPs",
              "Advanced Security Suite"
            ],
            "cta_text": "Go Enterprise",
            "cta_url": "/order/enterprise-500",
            "highlight": false
          }
        ]
      },
      {
        "type": "cta",
        "heading": "Don''t Miss Out!",
        "description": "These deals expire strictly at midnight on November 30th.",
        "button_text": "Lock In Your Price Now",
        "button_url": "/signup"
      }
    ]
  }'::jsonb
FROM auth.users
ORDER BY created_at ASC
LIMIT 1;
