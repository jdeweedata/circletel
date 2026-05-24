-- Migration: Add Service Delivery Role Templates
-- Description: Adds Service Delivery Manager and Service Delivery Administrator roles
-- Date: 2025-10-31
-- Author: CircleTel Development Team

-- ============================================
-- Add Service Delivery Roles (Operations)
-- ============================================

-- Service Delivery Manager
INSERT INTO public.role_templates (
  id,
  name,
  description,
  department,
  level,
  permissions,
  color,
  icon,
  is_default
) VALUES (
  'service_delivery_manager',
  'Service Delivery Manager',
  'Manages end-to-end service delivery, installations, and customer activations',
  'Operations',
  'management',
  '["dashboard:view","dashboard:view_analytics","operations:view","operations:manage_workflows","operations:manage_inventory","operations:manage_logistics","orders:view","orders:process","orders:edit","customers:view","customers:edit","products:view","coverage:view","support:view_tickets","support:view_customer_history"]'::jsonb,
  'blue',
  'Truck',
  false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  level = EXCLUDED.level,
  permissions = EXCLUDED.permissions,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  updated_at = now();

-- Service Delivery Administrator
INSERT INTO public.role_templates (
  id,
  name,
  description,
  department,
  level,
  permissions,
  color,
  icon,
  is_default
) VALUES (
  'service_delivery_administrator',
  'Service Delivery Administrator',
  'Handles service delivery administration, scheduling, and coordination',
  'Operations',
  'staff',
  '["dashboard:view","operations:view","operations:manage_workflows","operations:manage_logistics","orders:view","orders:process","customers:view","products:view","coverage:view","support:view_tickets"]'::jsonb,
  'teal',
  'ClipboardList',
  false
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  level = EXCLUDED.level,
  permissions = EXCLUDED.permissions,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  updated_at = now();

-- ============================================
-- Verification Query
-- ============================================

-- Run this to verify the new roles were added:
-- SELECT id, name, department, level, jsonb_array_length(permissions) as permission_count
-- FROM public.role_templates
-- WHERE id IN ('service_delivery_manager', 'service_delivery_administrator')
-- ORDER BY level DESC, name;
