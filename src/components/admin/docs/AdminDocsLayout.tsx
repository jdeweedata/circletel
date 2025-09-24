import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Book,
  Settings,
  Shield,
  Database,
  Workflow,
  AlertTriangle,
  Search,
  Menu,
  X,
  Home,
  Code,
  Users,
  FileText,
  Zap
} from 'lucide-react';

interface DocSection {
  title: string;
  items: DocItem[];
}

interface DocItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description: string;
}

const AdminDocsLayout = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const docSections: DocSection[] = [
    {
      title: "Getting Started",
      items: [
        {
          title: "Overview",
          href: "/admin/docs/overview",
          icon: Home,
          description: "Admin system architecture and introduction"
        },
        {
          title: "Authentication",
          href: "/admin/docs/authentication",
          icon: Shield,
          description: "Auth flows, permissions, and security"
        }
      ]
    },
    {
      title: "Core Features",
      items: [
        {
          title: "Product Management",
          href: "/admin/docs/product-management",
          icon: Settings,
          description: "CRUD operations for business products"
        },
        {
          title: "Approval Workflows",
          href: "/admin/docs/workflows",
          icon: Workflow,
          description: "Multi-step approval processes"
        },
        {
          title: "User Management",
          href: "/admin/docs/user-management",
          icon: Users,
          description: "Admin user roles and permissions"
        }
      ]
    },
    {
      title: "Technical Reference",
      items: [
        {
          title: "API Reference",
          href: "/admin/docs/api-reference",
          icon: Code,
          description: "Edge function documentation"
        },
        {
          title: "Database Schema",
          href: "/admin/docs/database",
          icon: Database,
          description: "Database structure and migrations"
        },
        {
          title: "Real-time Sync",
          href: "/admin/docs/realtime",
          icon: Zap,
          badge: "New",
          description: "Live data updates and webhooks"
        }
      ]
    },
    {
      title: "Troubleshooting",
      items: [
        {
          title: "Common Issues",
          href: "/admin/docs/troubleshooting",
          icon: AlertTriangle,
          description: "Solutions to frequent problems"
        },
        {
          title: "Error Codes",
          href: "/admin/docs/error-codes",
          icon: FileText,
          description: "Complete error reference guide"
        }
      ]
    }
  ];

  const isActiveLink = (href: string) => {
    return location.pathname === href;
  };

  const allItems = docSections.flatMap(section => section.items);
  const filteredItems = searchQuery
    ? allItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Admin Docs</h2>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mt-3 space-y-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="block p-2 text-sm rounded-md hover:bg-accent"
                  onClick={() => {
                    setSearchQuery('');
                    setSidebarOpen(false);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span className="font-medium">{item.title}</span>
                  </div>
                  <div className="text-muted-foreground text-xs mt-1">
                    {item.description}
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground">
                No results found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        {!searchQuery && (
          <nav className="space-y-6">
            {docSections.map((section) => (
              <div key={section.title}>
                <h3 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                  {section.title}
                </h3>
                <div className="space-y-1">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`flex items-center gap-3 p-2 rounded-md text-sm transition-colors ${
                        isActiveLink(item.href)
                          ? 'bg-circleTel-orange text-white'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div className="text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-2">
            <Book className="h-4 w-4" />
            <span>Admin Documentation</span>
          </div>
          <div>Last updated: {new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden border-b bg-background sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5 text-circleTel-orange" />
            <span className="font-semibold">Admin Docs</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-background border-r transform transition-transform lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <SidebarContent />
        </div>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <main className="max-w-4xl mx-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminDocsLayout;