import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '@/lib/markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertTriangle,
  Search,
  CheckCircle,
  XCircle,
  HelpCircle,
  Zap,
  Database,
  Shield,
  RefreshCw
} from 'lucide-react';

interface TroubleshootingItem {
  id: string;
  category: string;
  title: string;
  problem: string;
  solution: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

const AdminTroubleshooting = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const troubleshootingItems: TroubleshootingItem[] = [
    {
      id: 'auth-001',
      category: 'Authentication',
      title: 'Login fails with "Invalid credentials"',
      problem: 'User cannot log in despite entering correct email and password',
      solution: `Check the following steps:

1. **Verify Account Status**
   - Ensure the user account is active in the admin_profiles table
   - Check if the account has been disabled or suspended

2. **Password Issues**
   - Verify the password meets security requirements
   - Check if password has expired (90-day policy)
   - Try resetting the password

3. **Database Issues**
   - Verify the admin_profiles table exists and is accessible
   - Check RLS policies are correctly configured
   - Ensure the user has the correct role assigned`,
      code: `-- Check user status in database
SELECT
  ap.role,
  ap.is_active,
  ap.last_login,
  u.email
FROM admin_profiles ap
JOIN auth.users u ON ap.user_id = u.id
WHERE u.email = 'admin@circletel.co.za';`,
      severity: 'high',
      tags: ['authentication', 'login', 'database']
    },
    {
      id: 'auth-002',
      category: 'Authentication',
      title: 'Session expires immediately after login',
      problem: 'User logs in successfully but gets logged out within seconds',
      solution: `This usually indicates JWT token issues:

1. **Check System Time**
   - Ensure server and client clocks are synchronized
   - JWT tokens are time-sensitive

2. **Token Configuration**
   - Verify JWT secret is properly configured
   - Check token expiration settings in Supabase dashboard

3. **Browser Issues**
   - Clear browser cookies and local storage
   - Try logging in from an incognito window
   - Check for browser extensions blocking cookies`,
      code: `// Check JWT token in browser console
// console.log('JWT Token:', localStorage.getItem('supabase.auth.token'));

// Clear auth data
localStorage.removeItem('supabase.auth.token');
sessionStorage.clear();`,
      severity: 'medium',
      tags: ['jwt', 'session', 'browser']
    },
    {
      id: 'perm-001',
      category: 'Permissions',
      title: 'Permission denied for admin operations',
      problem: 'Admin user receives permission denied errors when trying to access features',
      solution: `Permission errors usually stem from role configuration:

1. **Check User Role**
   - Verify the user has the correct role in admin_profiles
   - Ensure role permissions are properly configured

2. **RLS Policy Issues**
   - Check Row Level Security policies on affected tables
   - Verify policies allow access for the user's role

3. **API Permissions**
   - Ensure Edge Functions have proper role checking
   - Verify API endpoints validate permissions correctly`,
      code: `-- Update user role
UPDATE admin_profiles
SET role = 'admin', permissions = '{"canApprove": true, "canEdit": true}'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'user@circletel.co.za'
);`,
      severity: 'high',
      tags: ['permissions', 'roles', 'rls']
    },
    {
      id: 'data-001',
      category: 'Data Sync',
      title: 'Real-time updates not working',
      problem: 'Dashboard data does not update in real-time across multiple clients',
      solution: `Real-time sync issues can have several causes:

1. **WebSocket Connection**
   - Check browser network tab for WebSocket errors
   - Verify Supabase real-time is enabled for the table

2. **Subscription Setup**
   - Ensure real-time subscriptions are properly configured
   - Check for memory leaks in subscription cleanup

3. **RLS and Real-time**
   - Verify RLS policies work with real-time subscriptions
   - Check that the user has SELECT permissions on subscribed tables`,
      code: `// Debug real-time subscription
const subscription = supabase
  .channel('admin-updates')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'products' },
    (payload) => {
      // Handle real-time update
      // Handle real-time update payload
    }
  )
  .subscribe((status) => {
    // Handle subscription status
    // Handle subscription status
  });

// Check subscription status
// Check active subscriptions`,
      severity: 'medium',
      tags: ['realtime', 'websocket', 'subscriptions']
    },
    {
      id: 'perf-001',
      category: 'Performance',
      title: 'Admin dashboard loads slowly',
      problem: 'Dashboard takes more than 5 seconds to load or displays data slowly',
      solution: `Performance issues can be optimized:

1. **Database Queries**
   - Add indexes to frequently queried columns
   - Optimize complex queries with EXPLAIN ANALYZE
   - Use pagination for large datasets

2. **Network Issues**
   - Check network latency to Supabase
   - Optimize API payload sizes
   - Implement caching where appropriate

3. **Frontend Optimization**
   - Use React.memo for expensive components
   - Implement virtualization for large lists
   - Optimize bundle size and lazy load components`,
      code: `-- Add index for better query performance
CREATE INDEX idx_products_category_status
ON products(category, status)
WHERE status = 'active';

-- Analyze query performance
EXPLAIN ANALYZE
SELECT * FROM products
WHERE category = 'fibre' AND status = 'active'
ORDER BY created_at DESC
LIMIT 50;`,
      severity: 'low',
      tags: ['performance', 'database', 'optimization']
    },
    {
      id: 'api-001',
      category: 'API Errors',
      title: 'Edge Function returns 500 errors',
      problem: 'Admin API calls fail with internal server errors',
      solution: `Server errors in Edge Functions require investigation:

1. **Check Function Logs**
   - View Edge Function logs in Supabase dashboard
   - Look for JavaScript errors or unhandled exceptions

2. **Environment Variables**
   - Verify all required environment variables are set
   - Check Supabase secrets configuration

3. **Code Issues**
   - Review recent deployments for breaking changes
   - Test functions locally with supabase functions serve
   - Check for async/await issues or Promise rejections`,
      code: `// Test Edge Function locally
supabase functions serve admin-auth --env-file .env.local

// Check function logs
supabase functions logs admin-auth

// Deploy with debug info
supabase functions deploy admin-auth --debug`,
      severity: 'critical',
      tags: ['edge-functions', 'api', 'deployment']
    }
  ];

  const filteredItems = searchQuery
    ? troubleshootingItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.problem.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : troubleshootingItems;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return XCircle;
      case 'high': return AlertTriangle;
      case 'medium': return HelpCircle;
      case 'low': return CheckCircle;
      default: return HelpCircle;
    }
  };

  const categories = [...new Set(troubleshootingItems.map(item => item.category))];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-6 w-6 text-circleTel-orange" />
          <Badge variant="outline" className="text-circleTel-orange border-circleTel-orange">
            Troubleshooting Guide
          </Badge>
        </div>
        <h1 className="text-4xl font-bold font-inter mb-4">
          Troubleshooting & Support
        </h1>
        <p className="text-xl text-muted-foreground">
          Common issues, solutions, and debugging guides for the CircleTel admin system.
        </p>
      </div>

      {/* Search */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search troubleshooting guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-lg h-12"
            />
          </div>
          {searchQuery && (
            <div className="mt-4 text-sm text-muted-foreground">
              Found {filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''} for "{searchQuery}"
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {categories.map((category) => {
          const categoryItems = troubleshootingItems.filter(item => item.category === category);
          const criticalCount = categoryItems.filter(item => item.severity === 'critical').length;

          return (
            <Card key={category}>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-circleTel-orange mb-1">
                  {categoryItems.length}
                </div>
                <div className="text-sm text-muted-foreground mb-2">{category}</div>
                {criticalCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {criticalCount} Critical
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Emergency Contacts */}
      <Card className="mb-8 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Emergency Support
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold text-red-800">Critical System Issues</div>
              <div className="text-red-700">
                Email: emergency@circletel.co.za<br />
                Response: Within 1 hour
              </div>
            </div>
            <div>
              <div className="font-semibold text-red-800">After Hours Support</div>
              <div className="text-red-700">
                Phone: +27 87 550 0000<br />
                Available: 24/7
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Troubleshooting Items */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold font-inter">Common Issues</h2>

        <Accordion type="single" collapsible className="w-full">
          {filteredItems.map((item) => {
            const SeverityIcon = getSeverityIcon(item.severity);

            return (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-start gap-3 flex-1">
                    <SeverityIcon className={`h-5 w-5 mt-0.5 ${getSeverityColor(item.severity).split(' ')[0]}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{item.title}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs ${getSeverityColor(item.severity)}`}
                        >
                          {item.severity}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{item.problem}</div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-4 space-y-4">
                    <div className="prose prose-gray max-w-none">
                      <ReactMarkdown
                        components={markdownComponents}
                        remarkPlugins={[remarkGfm]}
                      >
                        {item.solution}
                      </ReactMarkdown>
                    </div>

                    {item.code && (
                      <div>
                        <h4 className="font-semibold mb-2">Code Example</h4>
                        <pre className="bg-black text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                          <code>{item.code}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* Support Resources */}
      <Card className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Database className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <div className="font-semibold">Database Issues</div>
                <div className="text-sm text-muted-foreground">
                  Check Supabase dashboard for real-time monitoring
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Zap className="h-6 w-6 text-yellow-600 mt-1" />
              <div>
                <div className="font-semibold">Performance Monitoring</div>
                <div className="text-sm text-muted-foreground">
                  Use browser dev tools and Supabase metrics
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-6 w-6 text-green-600 mt-1" />
              <div>
                <div className="font-semibold">Security Logs</div>
                <div className="text-sm text-muted-foreground">
                  Review audit logs for security incidents
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTroubleshooting;