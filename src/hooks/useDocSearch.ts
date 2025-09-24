import { useState, useMemo } from 'react';
import Fuse from 'fuse.js';

export interface SearchableDoc {
  id: string;
  title: string;
  content: string;
  path: string;
  category: string;
  tags: string[];
  description?: string;
}

const adminDocuments: SearchableDoc[] = [
  {
    id: 'overview',
    title: 'Admin System Overview',
    content: 'CircleTel Admin System comprehensive platform managing business operations products approval workflows modern technologies security best practices real-time data synchronization role-based access control React TypeScript Vite Tailwind Supabase PostgreSQL Edge Functions authentication MFA RBAC',
    path: '/admin/docs/overview',
    category: 'Getting Started',
    tags: ['overview', 'architecture', 'introduction'],
    description: 'Comprehensive guide to the CircleTel admin platform architecture, features, and capabilities.'
  },
  {
    id: 'authentication',
    title: 'Authentication & Security',
    content: 'authentication security Supabase Auth role-based access control login JWT tokens session validation RBAC admin roles permissions password security MFA two-factor authentication session management API security rate limiting CORS audit logging',
    path: '/admin/docs/authentication',
    category: 'Security',
    tags: ['authentication', 'security', 'roles', 'permissions', 'jwt', 'mfa'],
    description: 'Authentication flows, role-based access control, and security features.'
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    content: 'API reference Edge Functions database endpoints admin-auth admin-product-management admin-approval-workflow authentication JWT tokens rate limiting error handling SDK examples JavaScript TypeScript Supabase client',
    path: '/admin/docs/api-reference',
    category: 'Technical Reference',
    tags: ['api', 'edge-functions', 'endpoints', 'sdk', 'reference'],
    description: 'Complete reference for all admin system APIs, Edge Functions, and database endpoints.'
  },
  {
    id: 'product-management',
    title: 'Product Management',
    content: 'product management CRUD operations business products create update delete pricing tiers inventory tracking category organization product validation approval workflows',
    path: '/admin/docs/product-management',
    category: 'Core Features',
    tags: ['products', 'crud', 'management', 'inventory'],
    description: 'CRUD operations for business products and inventory management.'
  },
  {
    id: 'workflows',
    title: 'Approval Workflows',
    content: 'approval workflows multi-step approval processes product submissions price changes inventory updates policy modifications workflow configuration approval states pending approved rejected',
    path: '/admin/docs/workflows',
    category: 'Core Features',
    tags: ['workflows', 'approval', 'processes', 'states'],
    description: 'Multi-step approval processes and workflow configuration.'
  },
  {
    id: 'user-management',
    title: 'User Management',
    content: 'user management admin users role assignment permissions access levels activity monitoring session management user profiles admin roles super admin editor viewer',
    path: '/admin/docs/user-management',
    category: 'Core Features',
    tags: ['users', 'roles', 'permissions', 'management'],
    description: 'Admin user roles, permissions, and user management.'
  },
  {
    id: 'database',
    title: 'Database Schema',
    content: 'database schema PostgreSQL admin_profiles products approval_workflows RLS row level security migrations indexes foreign keys constraints data types',
    path: '/admin/docs/database',
    category: 'Technical Reference',
    tags: ['database', 'schema', 'postgresql', 'rls', 'migrations'],
    description: 'Database structure, schema, and migrations guide.'
  },
  {
    id: 'realtime',
    title: 'Real-time Sync',
    content: 'real-time synchronization live data updates WebSocket connections subscriptions collaborative editing conflict resolution offline mode notifications push updates',
    path: '/admin/docs/realtime',
    category: 'Technical Reference',
    tags: ['realtime', 'websocket', 'sync', 'live-updates'],
    description: 'Live data updates, real-time synchronization, and WebSocket connections.'
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    content: 'troubleshooting common issues login problems session expires permission denied real-time not working performance slow API errors 500 errors Edge Function errors database connection issues',
    path: '/admin/docs/troubleshooting',
    category: 'Support',
    tags: ['troubleshooting', 'issues', 'problems', 'solutions', 'debugging'],
    description: 'Common issues, solutions, and debugging guides for the admin system.'
  },
  {
    id: 'error-codes',
    title: 'Error Codes',
    content: 'error codes UNAUTHORIZED PERMISSION_DENIED VALIDATION_ERROR RATE_LIMITED SERVER_ERROR authentication errors API errors database errors troubleshooting error messages',
    path: '/admin/docs/error-codes',
    category: 'Support',
    tags: ['errors', 'codes', 'debugging', 'reference'],
    description: 'Complete error reference guide and troubleshooting information.'
  }
];

const fuseOptions = {
  keys: [
    {
      name: 'title',
      weight: 0.4
    },
    {
      name: 'content',
      weight: 0.3
    },
    {
      name: 'tags',
      weight: 0.2
    },
    {
      name: 'description',
      weight: 0.1
    }
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  shouldSort: true,
  sortBy: ['score']
};

export const useDocSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const fuse = useMemo(() => new Fuse(adminDocuments, fuseOptions), []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const results = fuse.search(searchQuery);
    return results.map(result => ({
      ...result.item,
      score: result.score,
      matches: result.matches
    }));
  }, [searchQuery, fuse]);

  const categories = useMemo(() => {
    const categoryMap = new Map();
    adminDocuments.forEach(doc => {
      if (!categoryMap.has(doc.category)) {
        categoryMap.set(doc.category, []);
      }
      categoryMap.get(doc.category).push(doc);
    });
    return Object.fromEntries(categoryMap);
  }, []);

  const getDocumentByPath = (path: string) => {
    return adminDocuments.find(doc => doc.path === path);
  };

  const getRelatedDocuments = (currentDoc: SearchableDoc, limit = 3) => {
    const related = adminDocuments.filter(doc =>
      doc.id !== currentDoc.id && (
        doc.category === currentDoc.category ||
        doc.tags.some(tag => currentDoc.tags.includes(tag))
      )
    );

    return related.slice(0, limit);
  };

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    categories,
    documents: adminDocuments,
    getDocumentByPath,
    getRelatedDocuments,
    hasResults: searchResults.length > 0,
    isSearching: searchQuery.trim().length > 0
  };
};

export type UseDocSearchReturn = ReturnType<typeof useDocSearch>;