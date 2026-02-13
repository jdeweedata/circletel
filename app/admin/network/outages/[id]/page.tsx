'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Users,
  CheckCircle,
  RefreshCw,
  Loader2,
  Send,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';

interface OutageUpdate {
  id: string;
  status: string;
  message: string;
  is_public: boolean;
  created_at: string;
}

interface Outage {
  id: string;
  incident_number: string;
  title: string;
  description: string | null;
  severity: 'minor' | 'major' | 'critical';
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  started_at: string;
  identified_at: string | null;
  resolved_at: string | null;
  affected_customer_count: number;
  affected_providers: string[];
  affected_regions: string[];
  root_cause: string | null;
  resolution_notes: string | null;
  outage_updates: OutageUpdate[];
}

const severityConfig = {
  minor: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  major: { color: 'bg-orange-100 text-orange-800 border-orange-300' },
  critical: { color: 'bg-red-100 text-red-800 border-red-300' }
};

const statusConfig = {
  investigating: { color: 'bg-purple-100 text-purple-800', label: 'Investigating', icon: '🔍' },
  identified: { color: 'bg-blue-100 text-blue-800', label: 'Identified', icon: '🎯' },
  monitoring: { color: 'bg-yellow-100 text-yellow-800', label: 'Monitoring', icon: '👀' },
  resolved: { color: 'bg-green-100 text-green-800', label: 'Resolved', icon: '✅' }
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

export default function OutageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [outage, setOutage] = useState<Outage | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [newUpdate, setNewUpdate] = useState({
    status: '',
    message: '',
    is_public: true
  });

  const fetchOutage = async () => {
    try {
      const response = await fetch(`/api/admin/network/outages/${id}`);
      if (response.ok) {
        const data = await response.json();
        setOutage(data.outage);
        setNewUpdate(prev => ({ ...prev, status: data.outage.status }));
      }
    } catch (error) {
      console.error('Failed to fetch outage:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutage();
  }, [id]);

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newUpdate.message.trim()) return;

    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/network/outages/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUpdate)
      });

      if (response.ok) {
        setNewUpdate({ status: outage?.status || 'investigating', message: '', is_public: true });
        fetchOutage();
      }
    } catch (error) {
      console.error('Failed to add update:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleQuickResolve = async () => {
    setUpdating(true);
    try {
      await fetch(`/api/admin/network/outages/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'resolved',
          message: 'This incident has been resolved.',
          is_public: true
        })
      });
      fetchOutage();
    } catch (error) {
      console.error('Failed to resolve:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!outage) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-lg text-gray-600">Incident not found</p>
        <Link href="/admin/network/outages">
          <Button className="mt-4">Back to Incidents</Button>
        </Link>
      </div>
    );
  }

  const isResolved = outage.status === 'resolved';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/admin/network/outages">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className={severityConfig[outage.severity].color}>
                {outage.severity.toUpperCase()}
              </Badge>
              <Badge variant="outline" className={statusConfig[outage.status].color}>
                {statusConfig[outage.status].icon} {statusConfig[outage.status].label}
              </Badge>
              <span className="text-sm text-gray-500">{outage.incident_number}</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{outage.title}</h1>
          </div>
        </div>

        {!isResolved && (
          <Button
            onClick={handleQuickResolve}
            disabled={updating}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark Resolved
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {outage.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{outage.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Add Update Form */}
          {!isResolved && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Post Update</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUpdate} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Select
                        value={newUpdate.status}
                        onValueChange={(value) => setNewUpdate(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="identified">Identified</SelectItem>
                          <SelectItem value="monitoring">Monitoring</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setNewUpdate(prev => ({ ...prev, is_public: !prev.is_public }))}
                    >
                      {newUpdate.is_public ? (
                        <><Eye className="w-4 h-4 mr-1" /> Public</>
                      ) : (
                        <><EyeOff className="w-4 h-4 mr-1" /> Internal</>
                      )}
                    </Button>
                  </div>

                  <Textarea
                    value={newUpdate.message}
                    onChange={(e) => setNewUpdate(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Update message..."
                    rows={3}
                  />

                  <Button type="submit" disabled={updating || !newUpdate.message.trim()}>
                    {updating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    Post Update
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {outage.outage_updates
                  ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((update) => (
                    <div key={update.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          update.status === 'resolved' ? 'bg-green-500' :
                          update.status === 'identified' ? 'bg-blue-500' :
                          update.status === 'monitoring' ? 'bg-yellow-500' :
                          'bg-purple-500'
                        }`} />
                        <div className="w-px h-full bg-gray-200" />
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={statusConfig[update.status as keyof typeof statusConfig]?.color}>
                            {statusConfig[update.status as keyof typeof statusConfig]?.label}
                          </Badge>
                          {!update.is_public && (
                            <Badge variant="secondary" className="text-xs">
                              <EyeOff className="w-3 h-3 mr-1" />
                              Internal
                            </Badge>
                          )}
                          <span className="text-xs text-gray-500">
                            {formatDate(update.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700">{update.message}</p>
                      </div>
                    </div>
                  ))}

                {/* Initial incident */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        Incident Started
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatDate(outage.started_at)}
                      </span>
                    </div>
                    <p className="text-gray-700">Incident declared</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Started</p>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatDate(outage.started_at)}
                </p>
              </div>

              {outage.identified_at && (
                <div>
                  <p className="text-sm text-gray-500">Identified</p>
                  <p className="font-medium">{formatDate(outage.identified_at)}</p>
                </div>
              )}

              {outage.resolved_at && (
                <div>
                  <p className="text-sm text-gray-500">Resolved</p>
                  <p className="font-medium text-green-600">
                    {formatDate(outage.resolved_at)}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">Affected Customers</p>
                <p className="font-medium flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  {outage.affected_customer_count || 0}
                </p>
              </div>

              {outage.affected_providers.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Affected Providers</p>
                  <div className="flex flex-wrap gap-2">
                    {outage.affected_providers.map((provider) => (
                      <Badge key={provider} variant="secondary">
                        {provider}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {outage.affected_regions.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Affected Regions</p>
                  <div className="flex flex-wrap gap-2">
                    {outage.affected_regions.map((region) => (
                      <Badge key={region} variant="secondary">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Root Cause */}
          {outage.root_cause && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Root Cause</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{outage.root_cause}</p>
              </CardContent>
            </Card>
          )}

          {/* Resolution */}
          {outage.resolution_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{outage.resolution_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
