'use client';

/**
 * CMS Dashboard Page
 *
 * Main content management interface with modern, polished UI
 * Features:
 * - List all pages with pagination
 * - Search by title/slug
 * - Filter by status and content type
 * - Quick actions (edit, delete, publish)
 * - Status indicators
 * - Statistics overview
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  ImageIcon,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';

interface Page {
  id: string;
  slug: string;
  title: string;
  content_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author_id: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function CMSDashboard() {
  const [pages, setPages] = useState<Page[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch pages
  const fetchPages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (contentTypeFilter) params.append('contentType', contentTypeFilter);

      const response = await fetch(`/api/cms/pages?${params}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (response.ok) {
        setPages(data.pages);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch pages:', data.error);

        if (response.status === 401) {
          window.location.href = '/admin/login?redirect=/admin/cms';
        } else if (response.status === 403) {
          alert('You do not have permission to access the CMS. Please contact an administrator.');
        }
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [pagination.page, searchTerm, statusFilter, contentTypeFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }

    try {
      const response = await fetch(`/api/cms/pages/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        fetchPages();
        setDeleteConfirm(null);
      } else {
        const data = await response.json();
        alert(`Failed to delete page: ${data.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete page');
    }
  };

  const handlePublishToggle = async (page: Page) => {
    const newStatus = page.status === 'published' ? 'draft' : 'published';

    try {
      const response = await fetch(`/api/cms/pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchPages();
      } else {
        const data = await response.json();
        alert(`Failed to update status: ${data.error}`);
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      draft: {
        bg: 'bg-slate-100 border-slate-200',
        text: 'text-slate-700',
        icon: <Edit className="w-3 h-3" />,
      },
      in_review: {
        bg: 'bg-amber-100 border-amber-200',
        text: 'text-amber-700',
        icon: <Clock className="w-3 h-3" />,
      },
      scheduled: {
        bg: 'bg-sky-100 border-sky-200',
        text: 'text-sky-700',
        icon: <Clock className="w-3 h-3" />,
      },
      published: {
        bg: 'bg-emerald-100 border-emerald-200',
        text: 'text-emerald-700',
        icon: <CheckCircle2 className="w-3 h-3" />,
      },
      archived: {
        bg: 'bg-rose-100 border-rose-200',
        text: 'text-rose-700',
        icon: <XCircle className="w-3 h-3" />,
      },
    };

    const config = configs[status] || configs.draft;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text}`}>
        {config.icon}
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const stats = [
    {
      label: 'Total Pages',
      value: pagination.total,
      icon: FileText,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: 'Drafts',
      value: pages.filter(p => p.status === 'draft').length,
      icon: Edit,
      color: 'bg-slate-500',
      lightColor: 'bg-slate-50',
      textColor: 'text-slate-600',
    },
    {
      label: 'Published',
      value: pages.filter(p => p.status === 'published').length,
      icon: CheckCircle2,
      color: 'bg-emerald-500',
      lightColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      label: 'In Review',
      value: pages.filter(p => p.status === 'in_review').length,
      icon: Clock,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto space-y-8 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Content Management
            </h1>
            <p className="mt-2 text-lg text-slate-600">
              Create and manage your pages, blog posts, and landing pages with AI
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/admin/cms/usage">
              <Button variant="outline" className="gap-2 hover:border-circleTel-orange hover:text-circleTel-orange">
                <BarChart3 className="w-4 h-4" />
                AI Usage
              </Button>
            </Link>
            <Link href="/admin/cms/media">
              <Button variant="outline" className="gap-2 hover:border-circleTel-orange hover:text-circleTel-orange">
                <ImageIcon className="w-4 h-4" />
                Media Library
              </Button>
            </Link>
            <Link href="/admin/cms/create">
              <Button className="gap-2 bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-circleTel-orange shadow-lg shadow-orange-500/30">
                <Plus className="w-4 h-4" />
                Create New Page
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className={`absolute inset-0 ${stat.lightColor} opacity-50`} />
              <CardContent className="relative pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color} shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by title or slug..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent transition-all"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent appearance-none bg-white transition-all"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="in_review">In Review</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Content Type Filter */}
              <select
                value={contentTypeFilter}
                onChange={(e) => {
                  setContentTypeFilter(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-circleTel-orange focus:border-transparent appearance-none bg-white transition-all"
              >
                <option value="">All Types</option>
                <option value="landing_page">Landing Page</option>
                <option value="blog">Blog Post</option>
                <option value="product_page">Product Page</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Pages Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Your Pages</CardTitle>
                <CardDescription className="mt-1">
                  Manage {pagination.total} {pagination.total === 1 ? 'page' : 'pages'} across your website
                </CardDescription>
              </div>
              {!loading && pages.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPages}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-16">
                <RefreshCw className="w-12 h-12 mx-auto text-circleTel-orange animate-spin mb-4" />
                <p className="text-slate-600 font-medium">Loading your pages...</p>
              </div>
            ) : pages.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-slate-100 to-blue-100 rounded-2xl flex items-center justify-center mb-6">
                  <FileText className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No pages found</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter || contentTypeFilter
                    ? 'No pages match your current filters. Try adjusting your search.'
                    : 'Get started by creating your first page with AI assistance.'}
                </p>
                {!searchTerm && !statusFilter && !contentTypeFilter && (
                  <Link href="/admin/cms/create">
                    <Button className="gap-2 bg-gradient-to-r from-circleTel-orange to-orange-600 hover:from-orange-600 hover:to-circleTel-orange shadow-lg">
                      <Plus className="w-5 h-5" />
                      Create Your First Page
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b-2 border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Title
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {pages.map((page) => (
                        <tr
                          key={page.id}
                          className="hover:bg-slate-50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-circleTel-orange to-orange-600 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{page.title}</p>
                                <p className="text-sm text-slate-500 font-mono">/{page.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600 capitalize font-medium">
                              {page.content_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(page.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {formatDate(page.updated_at)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/admin/cms/edit/${page.id}`}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="gap-2 hover:bg-blue-50 hover:text-blue-600"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span className="hidden lg:inline">Edit</span>
                                </Button>
                              </Link>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePublishToggle(page)}
                                className={`gap-2 ${
                                  page.status === 'published'
                                    ? 'hover:bg-amber-50 hover:text-amber-600'
                                    : 'hover:bg-emerald-50 hover:text-emerald-600'
                                }`}
                              >
                                <Eye className="w-4 h-4" />
                                <span className="hidden lg:inline">
                                  {page.status === 'published' ? 'Unpublish' : 'Publish'}
                                </span>
                              </Button>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(page.id)}
                                className={`gap-2 ${
                                  deleteConfirm === page.id
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'hover:bg-red-50 hover:text-red-600'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden lg:inline">
                                  {deleteConfirm === page.id ? 'Confirm?' : 'Delete'}
                                </span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-6 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-600">
                      Showing <span className="font-semibold">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                      <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
                      <span className="font-semibold">{pagination.total}</span> results
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                      >
                        Previous
                      </Button>

                      <div className="hidden sm:flex gap-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                              className={pagination.page === pageNum ? 'bg-circleTel-orange hover:bg-orange-600' : ''}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
