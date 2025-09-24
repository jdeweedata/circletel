import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '@/lib/markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Key,
  Users,
  AlertTriangle,
  CheckCircle,
  Lock
} from 'lucide-react';

const authenticationContent = `
# Authentication & Security

The CircleTel Admin System implements a comprehensive authentication and authorization system using Supabase Auth with role-based access control.

## Authentication Flow

### Login Process

1. **Email & Password Authentication**
   - Admin users log in with their assigned email and password
   - Passwords must meet security requirements (8+ characters, mixed case, numbers)
   - Failed attempts are logged and rate-limited

2. **JWT Token Management**
   - Upon successful login, a JWT token is issued
   - Tokens have a configurable expiration time (default: 1 hour)
   - Refresh tokens enable seamless session renewal

3. **Session Validation**
   - All admin routes require valid authentication
   - Sessions are validated on each request
   - Automatic logout on token expiration

\`\`\`typescript
// Example: Using the authentication hook
import { useAdminAuth } from '@/hooks/useAdminAuth';

function AdminComponent() {
  const { user, isLoading, canApprove, canEdit } = useAdminAuth();

  if (isLoading) return <LoadingSpinner />;

  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      {canApprove && <ApprovalSection />}
      {canEdit && <EditingTools />}
    </div>
  );
}
\`\`\`

## Role-Based Access Control (RBAC)

### Admin Roles

The system supports multiple admin roles with different permission levels:

| Role | Permissions | Description |
|------|-------------|-------------|
| **Super Admin** | Full system access | Complete control over all features |
| **Admin** | Most features except user management | Can manage products and workflows |
| **Editor** | Content management only | Can edit products but not approve |
| **Viewer** | Read-only access | Can view but not modify anything |

### Permission Matrix

\`\`\`typescript
interface AdminPermissions {
  canViewDashboard: boolean;
  canManageProducts: boolean;
  canApproveChanges: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canAccessSettings: boolean;
}
\`\`\`

## Security Features

### Password Security
- Minimum 8 characters required
- Must include uppercase, lowercase, and numbers
- Password history prevents reuse of last 5 passwords
- Forced password changes every 90 days

### Session Security
- Automatic session timeout after 30 minutes of inactivity
- Concurrent session limits (max 3 active sessions)
- Device tracking and suspicious login detection
- Secure logout that invalidates all tokens

### API Security
- Rate limiting: 100 requests per minute per IP
- CORS protection with allowlisted domains
- Request signing for sensitive operations
- Audit logging for all admin actions

## Implementation Examples

### Protected Route Component

\`\`\`typescript
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'editor' | 'viewer';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, hasRole, isLoading } = useAdminAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/admin/unauthorized" replace />;
  }

  return <>{children}</>;
}
\`\`\`

### Login Form Implementation

\`\`\`typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export function AdminLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has admin role
      const { data: profile } = await supabase
        .from('admin_profiles')
        .select('role')
        .eq('user_id', data.user.id)
        .single();

      if (!profile) {
        throw new Error('No admin access');
      }

      // Redirect to dashboard
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* Form fields */}
    </form>
  );
}
\`\`\`

## Database Schema

### Admin Profiles Table

\`\`\`sql
CREATE TABLE admin_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'editor', 'viewer')),
  permissions jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  last_login timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own profile
CREATE POLICY "Users can view own profile" ON admin_profiles
  FOR SELECT USING (auth.uid() = user_id);
\`\`\`

## Troubleshooting

### Common Issues

**Login Fails with "Invalid Credentials"**
- Verify email and password are correct
- Check if account is active in admin_profiles table
- Ensure user has the proper admin role assigned

**Session Expires Immediately**
- Check system clock synchronization
- Verify JWT secret configuration
- Look for token corruption in browser storage

**Permission Denied Errors**
- Confirm user role has required permissions
- Check RLS policies on accessed tables
- Verify API endpoint permissions

### Security Checklist

- [ ] All admin accounts use strong passwords
- [ ] MFA is enabled for super admin accounts
- [ ] Session timeouts are properly configured
- [ ] Audit logging is active and monitored
- [ ] Regular security reviews are conducted
- [ ] Access permissions are reviewed quarterly
`;

const AdminAuthentication = () => {
  const securityFeatures = [
    {
      title: "Multi-Factor Authentication",
      description: "TOTP-based 2FA for enhanced security",
      status: "active",
      icon: Shield
    },
    {
      title: "Role-Based Access",
      description: "Granular permissions by user role",
      status: "active",
      icon: Users
    },
    {
      title: "Session Management",
      description: "Automatic timeout and device tracking",
      status: "active",
      icon: Key
    },
    {
      title: "Audit Logging",
      description: "Complete activity tracking",
      status: "active",
      icon: CheckCircle
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-6 w-6 text-circleTel-orange" />
          <Badge variant="outline" className="text-circleTel-orange border-circleTel-orange">
            Security Guide
          </Badge>
        </div>
        <h1 className="text-4xl font-bold font-inter mb-4">
          Authentication & Security
        </h1>
        <p className="text-xl text-muted-foreground">
          Comprehensive guide to authentication flows, role-based access control, and security features.
        </p>
      </div>

      {/* Security Alert */}
      <Alert className="mb-8 border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Security Notice:</strong> Admin credentials should never be shared.
          All authentication events are logged and monitored.
        </AlertDescription>
      </Alert>

      {/* Security Features */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold font-inter mb-6">Security Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {securityFeatures.map((feature) => (
            <Card key={feature.title}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <feature.icon className="h-8 w-8 text-green-600" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{feature.title}</h3>
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600"
                      >
                        {feature.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Main Documentation */}
      <div className="prose prose-gray max-w-none">
        <ReactMarkdown
          components={markdownComponents}
          remarkPlugins={[remarkGfm]}
        >
          {authenticationContent}
        </ReactMarkdown>
      </div>

      {/* Security Best Practices */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            Security Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Use strong, unique passwords for all admin accounts</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Enable two-factor authentication on all super admin accounts</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Regularly review and audit user permissions</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Monitor login attempts and suspicious activities</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <span>Keep sessions logged out when not in use</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuthentication;