# Role-Based Access Control (RBAC) System Guide

Complete guide to CircleTel's comprehensive RBAC system with role templates for different organizational functions.

## Table of Contents
- [Overview](#overview)
- [Role Templates](#role-templates)
- [Permissions](#permissions)
- [Implementation Guide](#implementation-guide)
- [Usage Examples](#usage-examples)
- [Managing Roles](#managing-roles)

## Overview

The CircleTel RBAC system provides fine-grained access control with predefined role templates for different departments and job functions.

### Key Features
- ✅ **17+ Predefined Role Templates** for common organizational roles
- ✅ **100+ Granular Permissions** organized by resource
- ✅ **Department-Based Organization** (Executive, Finance, Sales, Marketing, etc.)
- ✅ **Level-Based Hierarchy** (Executive, Management, Staff, Support)
- ✅ **Custom Permissions** for user-specific overrides
- ✅ **Easy-to-Use React Hooks** for permission checking
- ✅ **UI Components** for permission-based rendering

## Role Templates

### Executive Management

#### CEO (Chief Executive Officer)
- **Department**: Executive
- **Level**: Executive
- **Permissions**: Full system access
- **Use Case**: C-level executive requiring complete oversight

#### CFO (Chief Financial Officer)
- **Department**: Executive
- **Level**: Executive
- **Key Permissions**:
  - Full financial management
  - Revenue and P&L reporting
  - Budget approval
  - Financial data export
- **Use Case**: Financial oversight and strategic planning

#### COO (Chief Operating Officer)
- **Department**: Executive
- **Level**: Executive
- **Key Permissions**:
  - Full operational management
  - Product catalog control
  - Workflow management
  - Performance monitoring
- **Use Case**: Daily operations and process optimization

### Financial Roles

#### Finance Manager
- **Department**: Finance
- **Level**: Management
- **Key Permissions**:
  - Billing and invoicing
  - Budget management
  - Financial reporting
  - Expense approval
- **Use Case**: Managing finance team and operations

#### Accountant
- **Department**: Finance
- **Level**: Staff
- **Key Permissions**:
  - Invoice management
  - Payment processing
  - Financial record keeping
- **Use Case**: Day-to-day accounting operations

#### Billing Specialist
- **Department**: Finance
- **Level**: Staff
- **Key Permissions**:
  - Billing operations
  - Subscription management
  - Customer billing queries
- **Use Case**: Dedicated billing and subscription management

### Product & Operations

#### Product Manager
- **Department**: Product
- **Level**: Management
- **Default Role**: ✅
- **Key Permissions**:
  - Product CRUD operations
  - Pricing management
  - Product approval workflow
  - Coverage management
- **Use Case**: Product catalog management

#### Product Analyst
- **Department**: Product
- **Level**: Staff
- **Key Permissions**:
  - Analytics and reporting
  - Product performance metrics
  - Data export
- **Use Case**: Product analytics and insights

#### Operations Manager
- **Department**: Operations
- **Level**: Management
- **Key Permissions**:
  - Workflow management
  - Inventory control
  - Logistics oversight
  - Order processing
- **Use Case**: Daily operations coordination

### Sales & Marketing

#### Sales Manager
- **Department**: Sales
- **Level**: Management
- **Key Permissions**:
  - Lead management
  - Pipeline oversight
  - Deal closing
  - Commission tracking
- **Use Case**: Sales team leadership

#### Sales Representative
- **Department**: Sales
- **Level**: Staff
- **Key Permissions**:
  - Lead handling
  - Order creation
  - Customer management
- **Use Case**: Front-line sales activities

#### Marketing Manager
- **Department**: Marketing
- **Level**: Management
- **Key Permissions**:
  - Campaign creation
  - Content publishing
  - Analytics review
  - Promotion management
- **Use Case**: Marketing strategy and execution

#### Content Editor
- **Department**: Marketing
- **Level**: Staff
- **Default Role**: ✅
- **Key Permissions**:
  - Content creation
  - CMS management
  - Publishing rights
- **Use Case**: Website content management

### Support & Service

#### Support Manager
- **Department**: Support
- **Level**: Management
- **Key Permissions**:
  - Ticket management
  - Customer data access
  - Order modifications
  - Team oversight
- **Use Case**: Customer support leadership

#### Support Agent
- **Department**: Support
- **Level**: Staff
- **Key Permissions**:
  - Ticket handling
  - Customer inquiries
  - Basic order viewing
- **Use Case**: Front-line customer support

### Technical & Administration

#### Super Administrator
- **Department**: IT
- **Level**: Executive
- **Default Role**: ✅
- **Permissions**: Complete system access
- **Use Case**: System administration and configuration

#### System Administrator
- **Department**: IT
- **Level**: Management
- **Key Permissions**:
  - System settings
  - Integration management
  - Security configuration
  - User management (view only)
- **Use Case**: Technical system management

### Read-Only Roles

#### Executive Viewer
- **Department**: Executive
- **Level**: Executive
- **Key Permissions**:
  - Dashboard and analytics (read-only)
  - Financial reports (read-only)
  - Business metrics (read-only)
- **Use Case**: Stakeholders requiring oversight without edit rights

#### Viewer
- **Department**: General
- **Level**: Support
- **Default Role**: ✅
- **Key Permissions**:
  - Basic dashboard access
  - Product viewing
- **Use Case**: Minimal access for auditors or observers

## Permissions

Permissions are organized by resource and action. Format: `{resource}:{action}`

### Permission Categories

#### Dashboard & Analytics
- `dashboard:view` - View dashboard
- `dashboard:view_analytics` - View analytics
- `dashboard:view_reports` - View reports
- `dashboard:export_data` - Export data

#### Product Management
- `products:view` - View products
- `products:create` - Create new products
- `products:edit` - Edit products
- `products:delete` - Delete products
- `products:approve` - Approve products
- `products:publish` - Publish products
- `products:manage_pricing` - Manage pricing
- `products:view_costs` - View cost data

#### Customer Management
- `customers:view` - View customers
- `customers:edit` - Edit customers
- `customers:delete` - Delete customers
- `customers:view_personal_info` - View PII
- `customers:export` - Export customer data

#### Orders
- `orders:view` - View orders
- `orders:create` - Create orders
- `orders:edit` - Edit orders
- `orders:cancel` - Cancel orders
- `orders:process` - Process orders
- `orders:refund` - Process refunds

#### Financial
- `billing:view` - View billing
- `billing:manage_invoices` - Manage invoices
- `billing:process_payments` - Process payments
- `billing:view_revenue` - View revenue
- `billing:manage_subscriptions` - Manage subscriptions
- `billing:export_reports` - Export reports
- `finance:view_all` - View all financial data
- `finance:approve_expenses` - Approve expenses
- `finance:manage_budgets` - Manage budgets
- `finance:view_profit_loss` - View P&L
- `finance:export_financial_data` - Export financial data

#### Marketing & Sales
- `marketing:view` - View marketing
- `marketing:create_campaigns` - Create campaigns
- `marketing:edit_campaigns` - Edit campaigns
- `marketing:manage_promotions` - Manage promotions
- `marketing:view_analytics` - View analytics
- `sales:view` - View sales
- `sales:manage_leads` - Manage leads
- `sales:view_pipeline` - View pipeline
- `sales:close_deals` - Close deals
- `sales:view_commissions` - View commissions

#### System Administration
- `users:view` - View users
- `users:create` - Create users
- `users:edit` - Edit users
- `users:delete` - Delete users
- `users:manage_roles` - Manage roles
- `users:view_activity` - View activity logs
- `system:view_logs` - View system logs
- `system:manage_settings` - Manage settings
- `system:manage_security` - Manage security
- `system:view_audit_trail` - View audit trail

[See `lib/rbac/permissions.ts` for complete list]

## Implementation Guide

### Using Permission Hooks

```typescript
import { usePermissions } from '@/hooks/usePermissions'
import { PERMISSIONS } from '@/lib/rbac/permissions'

function MyComponent() {
  const { hasPermission, can } = usePermissions()

  // Check specific permission
  if (hasPermission(PERMISSIONS.PRODUCTS.EDIT)) {
    // Show edit button
  }

  // Check resource action
  if (can.create('orders')) {
    // Show create order button
  }

  // Check multiple permissions (ANY)
  const { hasPermissions } = useHasPermissions([
    PERMISSIONS.PRODUCTS.VIEW,
    PERMISSIONS.PRODUCTS.EDIT
  ])

  // Check multiple permissions (ALL)
  const { hasPermissions: canManage } = useHasPermissions(
    [PERMISSIONS.PRODUCTS.EDIT, PERMISSIONS.PRODUCTS.APPROVE],
    true // requireAll
  )
}
```

### Using Permission Gate Component

```typescript
import { PermissionGate } from '@/components/rbac/PermissionGate'
import { PERMISSIONS } from '@/lib/rbac/permissions'

function MyComponent() {
  return (
    <div>
      {/* Single permission */}
      <PermissionGate permissions={PERMISSIONS.PRODUCTS.EDIT}>
        <EditButton />
      </PermissionGate>

      {/* Multiple permissions (ANY) */}
      <PermissionGate
        permissions={[
          PERMISSIONS.PRODUCTS.EDIT,
          PERMISSIONS.PRODUCTS.APPROVE
        ]}
      >
        <ManagePanel />
      </PermissionGate>

      {/* Multiple permissions (ALL) */}
      <PermissionGate
        permissions={[
          PERMISSIONS.PRODUCTS.EDIT,
          PERMISSIONS.PRODUCTS.APPROVE
        ]}
        requireAll={true}
      >
        <AdminPanel />
      </PermissionGate>

      {/* With fallback */}
      <PermissionGate
        permissions={PERMISSIONS.PRODUCTS.VIEW}
        fallback={<div>Access Denied</div>}
      >
        <ProductList />
      </PermissionGate>
    </div>
  )
}
```

### Protecting Routes

```typescript
// app/admin/products/edit/page.tsx
import { PermissionGate } from '@/components/rbac/PermissionGate'
import { PERMISSIONS } from '@/lib/rbac/permissions'
import { redirect } from 'next/navigation'

export default function EditProductPage() {
  return (
    <PermissionGate
      permissions={PERMISSIONS.PRODUCTS.EDIT}
      fallback={redirect('/admin')}
    >
      <EditProductForm />
    </PermissionGate>
  )
}
```

## Usage Examples

### Example 1: Conditional Rendering

```typescript
function ProductCard({ product }) {
  const { can } = usePermissions()

  return (
    <Card>
      <h3>{product.name}</h3>
      <p>{product.price}</p>

      {can.edit('products') && (
        <Button onClick={() => editProduct(product.id)}>
          Edit
        </Button>
      )}

      {can.delete('products') && (
        <Button onClick={() => deleteProduct(product.id)}>
          Delete
        </Button>
      )}
    </Card>
  )
}
```

### Example 2: Navigation Menu

```typescript
function AdminNav() {
  const { hasPermission } = usePermissions()

  const menuItems = [
    {
      label: 'Products',
      href: '/admin/products',
      permission: PERMISSIONS.PRODUCTS.VIEW
    },
    {
      label: 'Customers',
      href: '/admin/customers',
      permission: PERMISSIONS.CUSTOMERS.VIEW
    },
    {
      label: 'Billing',
      href: '/admin/billing',
      permission: PERMISSIONS.BILLING.VIEW
    },
    {
      label: 'Settings',
      href: '/admin/settings',
      permission: PERMISSIONS.SYSTEM.MANAGE_SETTINGS
    },
  ]

  return (
    <nav>
      {menuItems.map(item => (
        hasPermission(item.permission) && (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        )
      ))}
    </nav>
  )
}
```

### Example 3: Form Actions

```typescript
function ProductForm({ product }) {
  const { can } = usePermissions()

  const handleSubmit = async (data) => {
    if (product.id) {
      if (!can.edit('products')) {
        toast.error('No permission to edit products')
        return
      }
      await updateProduct(product.id, data)
    } else {
      if (!can.create('products')) {
        toast.error('No permission to create products')
        return
      }
      await createProduct(data)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}

      <PermissionGate permissions={PERMISSIONS.PRODUCTS.EDIT}>
        <Button type="submit">
          {product.id ? 'Update' : 'Create'}
        </Button>
      </PermissionGate>
    </form>
  )
}
```

## Managing Roles

### Viewing User Permissions

```sql
-- View all users with their effective permissions
SELECT * FROM admin_user_permissions;

-- Get permissions for a specific user
SELECT get_user_permissions('user-uuid-here');

-- Check if user has specific permission
SELECT user_has_permission('user-uuid-here', 'products:edit');
```

### Assigning Role Templates

```sql
-- Assign role template to user
UPDATE admin_users
SET role_template_id = 'sales_manager'
WHERE email = 'user@circletel.co.za';

-- Add custom permissions
UPDATE admin_users
SET custom_permissions = '["products:view", "orders:create"]'::jsonb
WHERE email = 'user@circletel.co.za';
```

### Creating Custom Permissions

Users inherit permissions from their role template but can have custom permissions added or overridden:

```sql
-- Add additional permission to user
UPDATE admin_users
SET custom_permissions = custom_permissions || '["finance:view_all"]'::jsonb
WHERE id = 'user-uuid';

-- Remove a permission (override)
UPDATE admin_users
SET custom_permissions = custom_permissions - 'products:delete'
WHERE id = 'user-uuid';
```

## Best Practices

1. **Use Role Templates**: Assign users to predefined templates rather than custom permissions
2. **Principle of Least Privilege**: Give users minimum permissions needed for their role
3. **Regular Audits**: Review user permissions quarterly
4. **Document Custom Permissions**: Always document why custom permissions were granted
5. **Test Permission Changes**: Always test in development before applying to production
6. **Use Permission Gates**: Protect UI elements and routes with permission checks
7. **Handle Missing Permissions Gracefully**: Show appropriate fallbacks, don't crash

## Troubleshooting

### User Can't See Menu Item
- Check if user has required permission
- Verify role template is assigned correctly
- Check if user account is active

### Permission Check Fails
- Ensure permission string matches exactly (case-sensitive)
- Verify user object is loaded
- Check if user is authenticated

### Custom Permissions Not Working
- Verify JSON syntax in database
- Check that permissions are merged correctly
- Review `get_user_permissions()` function output

## Support

For issues or questions about RBAC:
1. Check this documentation
2. Review `lib/rbac/permissions.ts` for available permissions
3. Review `lib/rbac/role-templates.ts` for role definitions
4. Check user's effective permissions in database
5. Contact system administrator
