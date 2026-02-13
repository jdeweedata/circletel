'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Plus,
  Clock,
  Users,
  ChevronRight,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

interface Outage {
  id: string;
  incident_number: string;
  title: string;
  description: string | null;
  severity: 'minor' | 'major' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  started_at: string;
  resolved_at: string | null;
  affected_customer_count: number;
  affected_providers: string[];
}

const severityConfig = {
  minor: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: '⚠️' },
  major: { color: 'bg-orange-100 text-orange-800 border-orange-300', icon: '🔶' },
  critical: { color: 'bg-red-100 text-red-800 border-red-300', icon: '🔴' }
};

const statusConfig = {
  investigating: { color: 'bg-purple-100 text-purple-800', label: 'Investigating' },
  identified: { color: 'bg-blue-100 text-blue-800', label: 'Identified' },
  monitoring: { color: 'bg-yellow-100 text-yellow-800', label: 'Monitoring' },
  resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved' }
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatDuration(startDate: string, endDate: string | null): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
  return `${diffMins}m`;
}

export default function OutagesListPage() {
  const [outages, setOutages] = useState<Outage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');

  const fetchOutages = async (status: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/network/outages?status=${status}`);
      if (response.ok) {
        const data = await response.json();
        setOutages(data.outages || []);
      }
    } catch (error) {
      console.error('Failed to fetch outages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutages(activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incident Management</h1>
          <p className="text-gray-500 mt-1">Track and manage network incidents</p>
        </div>
        <Link href="/admin/network/outages/new">
          <Button className="bg-circleTel-orange hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Declare Incident
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="open" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Active
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Resolved
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : outages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-lg font-medium text-gray-900">
                  {activeTab === 'open' ? 'No active incidents' : 'No incidents found'}
                </p>
                <p className="text-gray-500 mt-1">
                  {activeTab === 'open' ? 'All systems are operational' : 'Try adjusting your filters'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {outages.map((outage) => (
                <Link key={outage.id} href={`/admin/network/outages/${outage.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge
                              variant="outline"
                              className={severityConfig[outage.severity].color}
                            >
                              {outage.severity.toUpperCase()}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={statusConfig[outage.status].color}
                            >
                              {statusConfig[outage.status].label}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {outage.incident_number}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900">
                            {outage.title}
                          </h3>

                          {outage.description && (
                            <p className="text-gray-600 mt-1 line-clamp-2">
                              {outage.description}
                            </p>
                          )}

                          <div className="flex items-center gap-6 mt-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              Started {formatDate(outage.started_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              Duration: {formatDuration(outage.started_at, outage.resolved_at)}
                            </span>
                            {outage.affected_customer_count > 0 && (
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {outage.affected_customer_count} affected
                              </span>
                            )}
                          </div>

                          {outage.affected_providers.length > 0 && (
                            <div className="flex items-center gap-2 mt-2">
                              {outage.affected_providers.map((provider) => (
                                <Badge key={provider} variant="secondary" className="text-xs">
                                  {provider}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
