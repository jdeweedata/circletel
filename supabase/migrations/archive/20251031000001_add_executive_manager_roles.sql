-- Migration: Add Executive and Manager RBAC Role Templates
-- Description: Adds new role templates for executives (CTO, CMO) and managers (General, Department, Regional)
-- Date: 2025-10-31
-- Author: CircleTel Development Team

-- ============================================
-- Add New Executive Role Templates
-- ============================================

-- Chief Technology Officer (CTO)
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
  'cto',
  'Chief Technology Officer',
  'Full technology, systems, and integration management access',
  'Executive',
  'executive',
  '["dashboard:view","dashboard:view_analytics","dashboard:view_reports","dashboard:export_data","system:view_logs","system:configure","system:view_audit_trail","system:manage_backups","integrations:view","integrations:manage","integrations:api_keys","integrations:webhooks","products:view","products:create","products:edit","products:delete","products:approve","products:view_costs","products:import","products:export","coverage:view","coverage:edit","coverage:view_analytics","coverage:manage_providers","operations:view","operations:manage_workflows","operations:manage_provisioning","operations:manage_installations","operations:view_logistics","users:view","users:edit","customers:view","orders:view","support:view_tickets"]'::jsonb,
  'slate',
  'Cpu',
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

-- Chief Marketing Officer (CMO)
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
  'cmo',
  'Chief Marketing Officer',
  'Full marketing, content, and brand management access',
  'Executive',
  'executive',
  '["dashboard:view","dashboard:view_analytics","dashboard:view_reports","dashboard:export_data","marketing:view","marketing:create_campaigns","marketing:manage_campaigns","marketing:view_analytics","marketing:manage_budget","cms:view","cms:edit","cms:publish","cms:manage_media","products:view","products:create","products:edit","products:delete","products:approve","products:export","customers:view","customers:export","sales:view","sales:view_pipeline","orders:view","billing:view","billing:view_revenue"]'::jsonb,
  'violet',
  'Sparkles',
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
-- Add New Management Role Templates
-- ============================================

-- General Manager
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
  'general_manager',
  'General Manager',
  'Broad operational authority across multiple departments',
  'Management',
  'management',
  '["dashboard:view","dashboard:view_analytics","dashboard:view_reports","dashboard:export_data","operations:view","operations:manage_workflows","operations:manage_provisioning","operations:manage_installations","operations:view_logistics","products:view","products:edit","products:approve","coverage:view","coverage:edit","customers:view","customers:edit","orders:view","orders:process","orders:edit","billing:view","billing:view_revenue","support:view_tickets","support:assign_tickets","sales:view","sales:view_pipeline","users:view"]'::jsonb,
  'indigo',
  'Briefcase',
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

-- Department Manager
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
  'department_manager',
  'Department Manager',
  'Manages specific department operations and team',
  'Management',
  'management',
  '["dashboard:view","dashboard:view_analytics","dashboard:view_reports","products:view","customers:view","customers:edit","orders:view","orders:process","support:view_tickets","support:assign_tickets","support:resolve_tickets","operations:view","operations:manage_workflows","users:view"]'::jsonb,
  'sky',
  'Users',
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

-- Regional Manager
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
  'regional_manager',
  'Regional Manager',
  'Oversees operations and sales within a specific region',
  'Management',
  'management',
  '["dashboard:view","dashboard:view_analytics","dashboard:view_reports","products:view","coverage:view","customers:view","customers:edit","orders:view","orders:create","orders:process","sales:view","sales:manage_leads","sales:view_pipeline","sales:close_deals","support:view_tickets","operations:view","billing:view"]'::jsonb,
  'cyan',
  'Map',
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
-- Add Comments for Documentation
-- ============================================

COMMENT ON TABLE public.role_templates IS 'Predefined RBAC role templates for admin users with permissions';

-- ============================================
-- Verification Query
-- ============================================

-- Run this to verify the new roles were added:
-- SELECT id, name, department, level, jsonb_array_length(permissions) as permission_count
-- FROM public.role_templates
-- WHERE id IN ('cto', 'cmo', 'general_manager', 'department_manager', 'regional_manager')
-- ORDER BY level, name;
