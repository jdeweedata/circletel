-- CircleTel Product Publishing Studio + commerce foundations.
-- Offer remains the commercial source of truth; publishing and checkout consume Offers.

CREATE TABLE IF NOT EXISTS public.offer_marketing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  headline text,
  short_description text,
  long_description text,
  highlights jsonb NOT NULL DEFAULT '[]'::jsonb,
  faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  seo_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  whatsapp_copy text,
  social_copy jsonb NOT NULL DEFAULT '{}'::jsonb,
  image_prompt_brief text,
  primary_image_url text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','approved','archived')),
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id)
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  page_type text NOT NULL
    CHECK (page_type IN ('offer','promotion','campaign','collection')),
  template text NOT NULL
    CHECK (template IN ('product_detail','promotion_landing','campaign_article','offer_collection','lead_popup')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','in_review','scheduled','published','archived')),
  summary text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  seo_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  channel_visibility jsonb NOT NULL DEFAULT '["website"]'::jsonb,
  valid_from timestamptz,
  valid_until timestamptz,
  published_at timestamptz,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaigns_status_idx ON public.campaigns (status);
CREATE INDEX IF NOT EXISTS campaigns_page_type_idx ON public.campaigns (page_type);
CREATE INDEX IF NOT EXISTS campaigns_validity_idx ON public.campaigns (valid_from, valid_until);

CREATE TABLE IF NOT EXISTS public.campaign_offer_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  label text,
  badge text,
  cta_label text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, offer_id, position)
);

CREATE INDEX IF NOT EXISTS campaign_offer_slots_campaign_id_idx
  ON public.campaign_offer_slots (campaign_id, position);
CREATE INDEX IF NOT EXISTS campaign_offer_slots_offer_id_idx
  ON public.campaign_offer_slots (offer_id);

CREATE TABLE IF NOT EXISTS public.channel_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES public.offers(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  channel text NOT NULL
    CHECK (channel IN ('website','whatsapp','google_shopping','facebook','partner','admin_sales')),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','ready','published','paused','archived')),
  external_id text,
  title text,
  description text,
  image_url text,
  destination_url text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (offer_id IS NOT NULL OR campaign_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS channel_listings_offer_channel_idx
  ON public.channel_listings (offer_id, channel);
CREATE INDEX IF NOT EXISTS channel_listings_campaign_channel_idx
  ON public.channel_listings (campaign_id, channel);

CREATE TABLE IF NOT EXISTS public.publishing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL
    CHECK (entity_type IN ('offer_marketing_profile','campaign','channel_listing')),
  entity_id uuid NOT NULL,
  event_type text NOT NULL
    CHECK (event_type IN ('created','updated','submitted','approved','rejected','scheduled','published','unpublished','archived')),
  actor_id uuid,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS publishing_events_entity_idx
  ON public.publishing_events (entity_type, entity_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid,
  auth_user_id uuid,
  session_id text,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','saved','converted_to_quote','checked_out','abandoned','expired')),
  customer_type text NOT NULL DEFAULT 'consumer'
    CHECK (customer_type IN ('consumer','business')),
  channel text NOT NULL DEFAULT 'website'
    CHECK (channel IN ('website','whatsapp','google_shopping','facebook','partner','admin_sales')),
  agent_id uuid,
  attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  currency text NOT NULL DEFAULT 'ZAR',
  totals jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS carts_status_idx ON public.carts (status);
CREATE INDEX IF NOT EXISTS carts_session_id_idx ON public.carts (session_id);
CREATE INDEX IF NOT EXISTS carts_customer_id_idx ON public.carts (customer_id);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  offer_id uuid NOT NULL REFERENCES public.offers(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  line_total numeric(10,2) NOT NULL DEFAULT 0,
  pricing_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  eligibility_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, offer_id)
);

CREATE INDEX IF NOT EXISTS cart_items_cart_id_idx ON public.cart_items (cart_id);
CREATE INDEX IF NOT EXISTS cart_items_offer_id_idx ON public.cart_items (offer_id);

CREATE TABLE IF NOT EXISTS public.order_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.consumer_orders(id) ON DELETE CASCADE,
  cart_item_id uuid REFERENCES public.cart_items(id),
  offer_id uuid REFERENCES public.offers(id),
  title text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  line_total numeric(10,2) NOT NULL DEFAULT 0,
  pricing_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  fulfillment_type text NOT NULL DEFAULT 'service'
    CHECK (fulfillment_type IN ('service','shipping','installation','activation','managed_service')),
  fulfillment_status text NOT NULL DEFAULT 'pending'
    CHECK (fulfillment_status IN ('pending','ready','in_progress','completed','blocked','cancelled')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS order_line_items_order_id_idx
  ON public.order_line_items (order_id);
CREATE INDEX IF NOT EXISTS order_line_items_offer_id_idx
  ON public.order_line_items (offer_id);
CREATE INDEX IF NOT EXISTS order_line_items_fulfillment_status_idx
  ON public.order_line_items (fulfillment_status);

ALTER TABLE public.consumer_orders
  ADD COLUMN IF NOT EXISTS cart_id uuid REFERENCES public.carts(id),
  ADD COLUMN IF NOT EXISTS channel text DEFAULT 'website',
  ADD COLUMN IF NOT EXISTS agent_id uuid,
  ADD COLUMN IF NOT EXISTS attribution jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS commission_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.offer_marketing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_offer_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channel_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publishing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_line_items ENABLE ROW LEVEL SECURITY;
