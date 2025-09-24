import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '@/lib/markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import {
  Shield,
  Database,
  Zap,
  Settings,
  Workflow,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const overviewContent = `
# Admin System Overview

The CircleTel Admin System is a comprehensive platform for managing business operations, products, and approval workflows. Built with modern technologies and security best practices, it provides real-time data synchronization and role-based access control.

## Architecture

The admin system follows a modular architecture with the following key components:

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for consistent styling
- **shadcn/ui** for component library
- **React Router** for client-side routing
- **React Query** for server state management

### Backend Stack
- **Supabase** as the primary backend service
- **PostgreSQL** database with Row Level Security (RLS)
- **Edge Functions** for serverless business logic
- **Real-time subscriptions** for live data updates
- **JWT authentication** with role-based permissions

### Security Features
- Multi-factor authentication (MFA) support
- Role-based access control (RBAC)
- API rate limiting and CORS protection
- Audit logging for all administrative actions
- Data encryption at rest and in transit

## Core Features

### Product Management
Complete CRUD operations for business products including:
- Product creation with validation
- Pricing tier management
- Inventory tracking
- Category organization

### Approval Workflows
Multi-step approval processes for:
- New product submissions
- Price changes
- Inventory updates
- Policy modifications

### User Management
Comprehensive user administration:
- Role assignment and permissions
- Access level configuration
- Activity monitoring
- Session management

### Real-time Synchronization
Live data updates across all connected clients:
- Instant notification system
- Collaborative editing support
- Conflict resolution
- Offline mode capabilities

## Quick Navigation

Use the sidebar to navigate through different sections of the documentation. Each section provides detailed information about specific aspects of the admin system.
`;

const AdminOverview = () => {
  const quickLinks = [
    {
      title: "Authentication Guide",
      description: "Learn about login flows and security",
      href: "/admin/docs/authentication",
      icon: Shield,
      color: "text-blue-600"
    },
    {
      title: "Database Schema",
      description: "Understand the data structure",
      href: "/admin/docs/database",
      icon: Database,
      color: "text-green-600"
    },
    {
      title: "API Reference",
      description: "Explore Edge Functions and APIs",
      href: "/admin/docs/api-reference",
      icon: Zap,
      color: "text-yellow-600"
    },
    {
      title: "Workflows",
      description: "Configure approval processes",
      href: "/admin/docs/workflows",
      icon: Workflow,
      color: "text-purple-600"
    }
  ];

  const systemStats = [
    { label: "Uptime", value: "99.9%", status: "excellent" },
    { label: "Response Time", value: "<200ms", status: "good" },
    { label: "Active Users", value: "24", status: "normal" },
    { label: "API Calls/day", value: "15.2K", status: "normal" }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Badge variant="outline" className="text-circleTel-orange border-circleTel-orange">
            Admin Documentation
          </Badge>
        </div>
        <h1 className="text-4xl font-bold font-inter mb-4">
          Admin System Overview
        </h1>
        <p className="text-xl text-muted-foreground">
          Comprehensive guide to the CircleTel admin platform architecture, features, and capabilities.
        </p>
      </div>

      {/* System Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {systemStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-circleTel-orange">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="prose prose-gray max-w-none mb-8">
        <ReactMarkdown
          components={markdownComponents}
          remarkPlugins={[remarkGfm]}
        >
          {overviewContent}
        </ReactMarkdown>
      </div>

      {/* Quick Links */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold font-inter mb-6">Quick Links</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Card className="h-full hover:shadow-lg transition-all duration-300 hover:border-circleTel-orange/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <link.icon className={`h-8 w-8 ${link.color}`} />
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        {link.title}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting Started */}
      <Card className="bg-gradient-to-r from-circleTel-orange/10 to-blue-500/10 border-circleTel-orange/20">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-4">Getting Started</h3>
          <p className="text-muted-foreground mb-4">
            New to the admin system? Start with these essential guides to get up and running quickly.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="default">
              <Link to="/admin/docs/authentication">
                Authentication Setup
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/docs/product-management">
                Product Management
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/docs/troubleshooting">
                Troubleshooting
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;