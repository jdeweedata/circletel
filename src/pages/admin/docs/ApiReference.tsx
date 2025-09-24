import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '@/lib/markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CodePlayground from '@/components/admin/docs/CodePlayground';
import {
  Code,
  Database,
  Zap,
  Copy,
  CheckCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  auth: boolean;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  response: string;
  example: string;
}

const AdminApiReference = () => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const edgeFunctions: ApiEndpoint[] = [
    {
      method: "POST",
      path: "/admin-auth",
      description: "Authenticate admin users and get JWT tokens",
      auth: false,
      parameters: [
        { name: "email", type: "string", required: true, description: "Admin email address" },
        { name: "password", type: "string", required: true, description: "Admin password" }
      ],
      response: "AuthResponse",
      example: `{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@circletel.co.za",
    "role": "admin"
  }
}`
    },
    {
      method: "POST",
      path: "/admin-product-management",
      description: "CRUD operations for business products",
      auth: true,
      parameters: [
        { name: "action", type: "string", required: true, description: "create | update | delete | list" },
        { name: "product_data", type: "object", required: false, description: "Product information" }
      ],
      response: "ProductResponse",
      example: `{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "BizFibre Connect",
    "category": "fibre",
    "pricing": { "basic": 899, "premium": 1299 },
    "status": "active"
  }
}`
    },
    {
      method: "POST",
      path: "/admin-approval-workflow",
      description: "Manage approval workflows for product changes",
      auth: true,
      parameters: [
        { name: "workflow_id", type: "string", required: true, description: "Workflow identifier" },
        { name: "action", type: "string", required: true, description: "approve | reject | request_changes" },
        { name: "comment", type: "string", required: false, description: "Approval comment" }
      ],
      response: "WorkflowResponse",
      example: `{
  "success": true,
  "workflow": {
    "id": "uuid",
    "status": "approved",
    "approved_by": "admin@circletel.co.za",
    "approved_at": "2024-01-15T10:30:00Z"
  }
}`
    }
  ];

  const databaseEndpoints: ApiEndpoint[] = [
    {
      method: "GET",
      path: "/admin_profiles",
      description: "Retrieve admin user profiles and permissions",
      auth: true,
      response: "AdminProfile[]",
      example: `[
  {
    "id": "uuid",
    "user_id": "uuid",
    "role": "admin",
    "permissions": {
      "canApprove": true,
      "canEdit": true
    },
    "last_login": "2024-01-15T09:15:00Z"
  }
]`
    },
    {
      method: "GET",
      path: "/products",
      description: "Get all business products with filtering",
      auth: true,
      parameters: [
        { name: "category", type: "string", required: false, description: "Filter by category" },
        { name: "status", type: "string", required: false, description: "Filter by status" }
      ],
      response: "Product[]",
      example: `[
  {
    "id": "uuid",
    "name": "SkyFibre Residential",
    "category": "fibre",
    "pricing_tiers": ["basic", "premium"],
    "status": "active",
    "created_at": "2024-01-10T00:00:00Z"
  }
]`
    }
  ];

  const apiDocumentation = `
# API Reference

Complete reference for all admin system APIs, including Edge Functions and database endpoints.

## Authentication

All admin API endpoints require authentication via JWT tokens. Include the token in the Authorization header:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
     -H "Content-Type: application/json" \\
     https://agyjovdugmtopasyvlng.supabase.co/functions/v1/admin-auth
\`\`\`

## Base URLs

- **Edge Functions**: \`https://agyjovdugmtopasyvlng.supabase.co/functions/v1/\`
- **Database API**: \`https://agyjovdugmtopasyvlng.supabase.co/rest/v1/\`
- **Real-time**: \`wss://agyjovdugmtopasyvlng.supabase.co/realtime/v1\`

## Error Handling

All APIs return standardized error responses:

\`\`\`json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Insufficient permissions for this operation",
    "details": {
      "required_role": "admin",
      "current_role": "editor"
    }
  }
}
\`\`\`

### Common Error Codes

| Code | Description |
|------|-------------|
| \`UNAUTHORIZED\` | Missing or invalid authentication |
| \`PERMISSION_DENIED\` | Insufficient permissions |
| \`VALIDATION_ERROR\` | Invalid request parameters |
| \`RATE_LIMITED\` | Too many requests |
| \`SERVER_ERROR\` | Internal server error |

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication**: 5 requests per minute
- **General APIs**: 100 requests per minute
- **Bulk operations**: 10 requests per minute

Rate limit headers are included in all responses:

\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1642680000
\`\`\`
`;

  const EndpointCard = ({ endpoint }: { endpoint: ApiEndpoint }) => (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <Badge
              variant={endpoint.method === 'GET' ? 'default' : 'secondary'}
              className={
                endpoint.method === 'GET'
                  ? 'bg-green-600 text-white'
                  : endpoint.method === 'POST'
                  ? 'bg-blue-600 text-white'
                  : 'bg-orange-600 text-white'
              }
            >
              {endpoint.method}
            </Badge>
            <code className="text-sm font-mono">{endpoint.path}</code>
          </CardTitle>
          {endpoint.auth && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              🔒 Auth Required
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">{endpoint.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {endpoint.parameters && (
            <div>
              <h4 className="font-semibold mb-2">Parameters</h4>
              <div className="space-y-2">
                {endpoint.parameters.map((param) => (
                  <div key={param.name} className="flex items-start gap-3 text-sm">
                    <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                      {param.name}
                    </code>
                    <Badge variant="outline" className="text-xs">
                      {param.type}
                    </Badge>
                    {param.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                    <span className="text-muted-foreground">{param.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Response Example</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(endpoint.example, endpoint.path)}
              >
                {copiedCode === endpoint.path ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copy
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
              <code>{endpoint.example}</code>
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Code className="h-6 w-6 text-circleTel-orange" />
          <Badge variant="outline" className="text-circleTel-orange border-circleTel-orange">
            API Documentation
          </Badge>
        </div>
        <h1 className="text-4xl font-bold font-inter mb-4">
          API Reference
        </h1>
        <p className="text-xl text-muted-foreground">
          Complete reference for all admin system APIs, Edge Functions, and database endpoints.
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Zap className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Edge Functions</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Serverless business logic APIs
            </p>
            <Button variant="outline" size="sm">
              View Functions <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <Database className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Database API</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Direct database operations
            </p>
            <Button variant="outline" size="sm">
              View Endpoints <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6 text-center">
            <ExternalLink className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Supabase Docs</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Official Supabase documentation
            </p>
            <Button variant="outline" size="sm">
              External Docs <ExternalLink className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="prose prose-gray max-w-none mb-8">
        <ReactMarkdown
          components={markdownComponents}
          remarkPlugins={[remarkGfm]}
        >
          {apiDocumentation}
        </ReactMarkdown>
      </div>

      {/* API Endpoints */}
      <Tabs defaultValue="edge-functions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edge-functions">Edge Functions</TabsTrigger>
          <TabsTrigger value="database">Database API</TabsTrigger>
        </TabsList>

        <TabsContent value="edge-functions" className="mt-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold font-inter mb-4">Edge Functions</h2>
            {edgeFunctions.map((endpoint) => (
              <EndpointCard key={endpoint.path} endpoint={endpoint} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="database" className="mt-6">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold font-inter mb-4">Database Endpoints</h2>
            {databaseEndpoints.map((endpoint) => (
              <EndpointCard key={endpoint.path} endpoint={endpoint} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Interactive Code Examples */}
      <div className="mt-8">
        <CodePlayground
          title="API Code Examples"
          description="Interactive examples you can modify and test"
          examples={[
            {
              id: 'auth-login',
              title: 'Authentication',
              description: 'Example of admin user authentication using Supabase client',
              language: 'typescript',
              editable: true,
              code: `import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://agyjovdugmtopasyvlng.supabase.co',
  'your-anon-key'
)

// Authenticate admin user
const authenticateAdmin = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('admin-auth', {
      body: {
        email: 'admin@circletel.co.za',
        password: 'your-password'
      }
    })

    if (error) throw error

    // Authentication successful
    return data.access_token
  } catch (error) {
    console.error('Authentication failed:', error.message)
  }
}

// Use the function
authenticateAdmin()`
            },
            {
              id: 'product-crud',
              title: 'Product CRUD',
              description: 'Example of creating and managing products via the admin API',
              language: 'typescript',
              editable: true,
              code: `// Create a new product
const createProduct = async (token) => {
  const productData = {
    name: 'BizFibre Connect Ultra',
    category: 'fibre',
    pricing: {
      basic: 899,
      premium: 1299
    },
    description: 'High-speed fibre for businesses',
    status: 'pending_approval'
  }

  const { data, error } = await supabase.functions.invoke(
    'admin-product-management',
    {
      headers: { Authorization: \`Bearer \${token}\` },
      body: {
        action: 'create',
        product_data: productData
      }
    }
  )

  if (error) throw error
  return data.product
}

// Usage
const newProduct = await createProduct(authToken)`
            },
            {
              id: 'database-query',
              title: 'Database Query',
              description: 'Example SQL queries for admin operations',
              language: 'sql',
              code: `-- Get all admin users with their roles
SELECT
  u.email,
  ap.role,
  ap.permissions,
  ap.last_login,
  ap.is_active
FROM auth.users u
JOIN admin_profiles ap ON u.id = ap.user_id
WHERE ap.is_active = true
ORDER BY ap.last_login DESC;

-- Get product approval statistics
SELECT
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (approved_at - created_at))/3600) as avg_hours_to_approval
FROM approval_workflows
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY status;

-- Find products needing approval
SELECT
  p.name,
  p.category,
  aw.status,
  aw.created_at,
  u.email as submitted_by
FROM products p
JOIN approval_workflows aw ON p.id = aw.product_id
JOIN auth.users u ON aw.submitted_by = u.id
WHERE aw.status = 'pending'
ORDER BY aw.created_at ASC;`
            },
            {
              id: 'curl-examples',
              title: 'cURL Commands',
              description: 'Command-line examples for testing APIs directly',
              language: 'bash',
              editable: true,
              code: `# Authenticate admin user
curl -X POST \\
  https://agyjovdugmtopasyvlng.supabase.co/functions/v1/admin-auth \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "admin@circletel.co.za",
    "password": "your-password"
  }'

# Create a new product (requires auth token)
curl -X POST \\
  https://agyjovdugmtopasyvlng.supabase.co/functions/v1/admin-product-management \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "action": "create",
    "product_data": {
      "name": "New Product",
      "category": "fibre",
      "pricing": {"basic": 500}
    }
  }'

# Approve a workflow
curl -X POST \\
  https://agyjovdugmtopasyvlng.supabase.co/functions/v1/admin-approval-workflow \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workflow_id": "uuid-here",
    "action": "approve",
    "comment": "Approved after review"
  }'`
            }
          ]}
        />
      </div>
    </div>
  );
};

export default AdminApiReference;